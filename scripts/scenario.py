"""Scenario format: a cast, scenes and turns, in Markdown. Parser and lint.

    # Сеньор Вадик. Часть 2

    ## Cast

    | voice | who |
    |---|---|
    | vadik | Вадик, 28, тимлид третью неделю |
    | mikhalych | Михалыч, старый сисадмин, курит у сервера Зинаида |

    ## Офис, утро
    > ambience office

    - narrator: [calm] Утро. Офис...
    - vadik@0.2: [nervous] Сделаем.
    - {pause 2}

`## Cast` (or `## Роли`, `## Персонажи`) is a table of every voice except `narrator`: voice, then `Name, who
they are`. The words before the first comma are the names the lint looks for.
Every other `##` heading starts a scene, its title the place and time; an
optional `> ambience NAME [volume]` line under it sets the background. Turns
and pauses are list items; other prose and `<!-- comments -->` are notes, not
read aloud. A turn-shaped line outside a list is an error, so no line is lost.
`- voice+phone: text` is a turn heard through a phone; `- {ambience NAME
[volume]}` or `- {ambience off}` changes the bed inside a scene; `- {sfx NAME
[volume] [@gap]}` plays a sound effect between turns, `@-1.5` overlapping the
previous turn, like a turn's own gap.

A `.txt` file is the older plain format: turns one per line, `{pause N}`, `#`
comments, an optional `@cast` block (`voice | desc` lines) and `@scene place |
ambience NAME` headers; `{ambience NAME}`, `{sfx NAME}` and `voice+phone:` work
there too. Files without a cast still parse; the lint then skips the checks
that need it.

Lint, from radio-drama craft (skills/scenario/craft.md): a listener with closed
eyes must know who speaks, where and when. A file with `<!-- lint: jingle -->`
(a series intro) skips the who-and-where checks.

Jokes: `<!-- plant: KEY -->` before the line that sets a joke up and
`<!-- payoff: KEY -->` before the line that pays it off. A payoff with no plant
earlier in the same file is an error: the listener never heard the setup (a
series intro does not count). A plant with no payoff is a warning. Scenes are
budgeted by length: over max(2, 0.7 per minute) is a warning, since listeners
cannot see a cut.

Beats: `<!-- beat: NAME -->` before the line a beat starts on, from the episode
template (skills/scenario/SKILL.md): hook, setup, incident, ladder (two or
more), turn, button, tag. Beats out of order, an unknown name, or a missing
hook, incident, turn, button or second ladder rung are warnings.
Errors stop a render; warnings are printed.

Usage: uv run scenario.py scene.txt   (exit 1 on errors)
"""

import json
import math
import re
import sys
from dataclasses import dataclass, field
from itertools import combinations, pairwise
from pathlib import Path
from typing import Any

TURN = re.compile(r"^([\w-]+)(\+phone)?(?:@(-?[\d.]+))?\s*:\s*(.+)$")
PAUSE = re.compile(r"^\{pause\s+([\d.]+)\}$")
BED_CHANGE = re.compile(r"^\{ambience\s+([\w-]+)(?:\s+([\d.]+))?\}$")
SFX = re.compile(r"^\{sfx\s+([\w-]+)(?:\s+([\d.]+))?(?:\s*@(-?[\d.]+))?\}$")
SCENE = re.compile(r"^@scene\s+(.+?)(?:\s*\|\s*ambience\s+([\w-]+)(?:\s+([\d.]+))?)?\s*$")
CAST_LINE = re.compile(r"^([\w-]+)\s*\|\s*(.+)$")
TAG = re.compile(r"\[([^\]]*)\]")
NARRATOR = "narrator"
STRESS = "\u0301"  # combining acute: «пи́дора»
MARK = re.compile(r"<!--\s*(plant|echo|payoff|arc|beat|length|laugh|needs|shows|lint-ok):\s*(.+?)\s*-->")
CHARS_PER_SEC = 11  # spoken characters per second, Drama 3 at --speed 1.1: 2896 in 261 s (an episode)


@dataclass
class Rules:
    """Structure the lint holds a scenario to. Defaults suit short comedy; a profile tunes them in
    structure.json (any subset of these fields) for its genre."""

    beats: tuple[str, ...] = ("hook", "setup", "incident", "ladder", "turn", "button", "tag")  # in order
    needed: tuple[str, ...] = ("hook", "incident", "turn", "button")
    shares: dict[str, float] = field(  # of the runtime; a beat past twice or under half its share is reported
        default_factory=lambda: {"hook": 0.06, "setup": 0.11, "incident": 0.05, "ladder": 0.46, "turn": 0.17, "button": 0.07, "tag": 0.07}
    )
    min_rungs: int = 2
    scenes_per_min: float = 0.7  # a cut costs a listener a reorientation
    callback_reach: float = 90  # seconds from a plant or echo to its payoff before the listener forgets
    callback_max: int = 3  # plant, echo, payoff
    button_words: int = 8
    cast_max: int = 6
    laugh_gap: float = 20  # seconds without a laugh before the listener drifts
    laughs_per_min: float = 3  # the floor for comedy; a drama profile sets 0
    # Dialogue sentence lengths, from «Волшебный участок» S01 (2188 sentences): 49% are 1-3 words,
    # 8% are 10 or more. A script far shorter reads as telegraph: the ear loses the links.
    clipped_max: float = 0.55  # share of 1-3 word sentences in dialogue, at most
    long_min: float = 0.05  # share of 10+ word sentences in dialogue, at least
    voice_sim_max: float = 0.4  # speaker similarity (voices/similarity.json): the pair listeners mixed up scored 0.44
    # A pair over voice_sim_max still passes this far apart in median pitch, semitones: mikhalych
    # and palych scored 0.46 at 7.6 semitones apart and were told apart by ear (one listener).
    voice_pitch_apart: float = 6
    length: float | None = None  # target minutes; an episode's <!-- length: N --> wins

    @classmethod
    def of(cls, path: str | Path) -> "Rules":
        """Defaults, overridden by the structure.json of the profile the file belongs to."""
        import profiles

        prof = profiles.of(path)
        f = prof / "structure.json" if prof else None
        if not f or not f.exists():
            return cls()
        data: dict[str, Any] = json.loads(f.read_text())
        if unknown := set(data) - set(cls.__dataclass_fields__):
            sys.exit(f"{f}: unknown fields {', '.join(sorted(unknown))}")
        fields: dict[str, Any] = {k: tuple(v) if isinstance(v, list) else v for k, v in data.items()}
        rules = cls(**fields)
        rules.shares = {**cls().shares, **data.get("shares", {})}
        return rules


@dataclass
class Turn:
    voice: str
    text: str
    gap: float | None
    line: int
    scene: int  # index into Scenario.scenes, -1 before the first header
    phone: bool = False  # `voice+phone:`, heard through a telephone


@dataclass
class Pause:
    secs: float
    line: int


@dataclass
class Ambience:
    """`{ambience NAME [volume]}`: a bed change inside a scene; NAME may be "off"."""

    ambience: str
    volume: float | None
    line: int


@dataclass
class Sfx:
    """`{sfx NAME [volume] [@gap]}`: a one-shot effect placed like a turn."""

    name: str
    volume: float | None
    gap: float | None
    line: int


@dataclass
class Scene:
    title: str
    ambience: str | None
    volume: float | None
    line: int


Item = Turn | Pause | Scene | Ambience | Sfx


@dataclass
class Node:
    """One row of the `## Map`: a want, a lie, an act, a fact... and why it is there."""

    id: str
    kind: str
    what: str
    because: list[str]  # ids of the nodes that motivate or cause it
    shown: str  # the scene where the listener gets it, or `later: WHERE`
    line: int
    who: str = ""  # the voice that acts, says or learns it
    knows: list[str] = field(default_factory=list)  # ids of what `who` must know first, each with its source
    via: str = ""  # how it reaches them: room, phone, screen, chat, memory, narration


# Kinds that need a reason: something a character does, or something that happens.
ACTS = {"lie", "act", "choice", "reveal", "turn", "payoff"}
KINDS = ACTS | {"want", "fear", "fact", "rule", "plant", "arc"}
VIA = {"room", "phone", "screen", "chat", "memory", "narration"}


@dataclass
class Scenario:
    cast: dict[str, str]  # voice -> description
    scenes: list[Scene]
    items: list[Item]  # in order; Scene marks where it starts
    jingle: bool = False  # `<!-- lint: jingle -->`, set by load()
    marks: list[tuple[str, str, int]] = field(default_factory=list)  # (kind, key, line) from <!-- kind: key -->
    length: float | None = None  # `<!-- length: 4.5 -->`, target minutes
    quiet: list[str] = field(default_factory=list)  # `<!-- lint-ok: words -->`: warnings containing them are dropped
    rules: Rules = field(default_factory=Rules)
    story: list[Node] = field(default_factory=list)  # the `## Map` table
    profile: Path | None = None  # the profile the file belongs to, set by load()

    @property
    def turns(self) -> list[Turn]:
        return [i for i in self.items if isinstance(i, Turn)]


def parse(text: str) -> Scenario:
    cast: dict[str, str] = {}
    scenes: list[Scene] = []
    items: list[Item] = []
    in_cast = False
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line:
            in_cast = False
            continue
        if line.startswith("#"):
            continue
        if line == "@cast":
            in_cast = True
        elif in_cast and (m := CAST_LINE.match(line)):
            cast[m[1]] = m[2].strip()
        elif m := SCENE.match(line):
            in_cast = False
            scene = Scene(m[1].strip(), m[2], float(m[3]) if m[3] else None, n)
            scenes.append(scene)
            items.append(scene)
        elif m := PAUSE.match(line):
            items.append(Pause(float(m[1]), n))
        elif m := SFX.match(line):
            items.append(sfx_item(m, n))
        elif m := BED_CHANGE.match(line):
            items.append(Ambience(m[1], float(m[2]) if m[2] else None, n))
        elif m := TURN.match(line):
            items.append(Turn(m[1], m[4], float(m[3]) if m[3] else None, n, len(scenes) - 1, bool(m[2])))
        else:
            sys.exit(f"line {n}: expected 'voice: text', '{{pause N}}', '@cast' or '@scene ...': {line}")
    return Scenario(cast, scenes, items)


def load(path: str | Path) -> Scenario:
    path = Path(path)
    text = path.read_text()
    sc = parse_md(text) if path.suffix in (".md", ".markdown") else parse(text)
    sc.jingle = "<!-- lint: jingle -->" in text
    sc.marks = [(m[1], m[2], text.count("\n", 0, m.start()) + 1) for m in MARK.finditer(text)]
    sc.length = next((float(key) for kind, key, _ in sc.marks if kind == "length"), None)
    sc.quiet = [key for kind, key, _ in sc.marks if kind == "lint-ok"]
    sc.rules = Rules.of(path)
    import profiles

    sc.profile = profiles.of(path)
    return sc


ITEM = re.compile(r"^[-*]\s+(.+)$")
AMBIENCE = re.compile(r"^>\s*ambience\s+([\w-]+)(?:\s+([\d.]+))?\s*$")
ROW = re.compile(r"^\|(.+)\|$")


def parse_md(text: str) -> Scenario:
    # Comments become blank lines, so line numbers in lint messages stay right.
    text = re.sub(r"<!--.*?-->", lambda m: "\n" * m[0].count("\n"), text, flags=re.DOTALL)
    cast: dict[str, str] = {}
    scenes: list[Scene] = []
    items: list[Item] = []
    story: list[Node] = []
    cols: list[str] = []  # the map table's header
    table = None  # "cast", "map" or None while inside a scene
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if line.startswith("## "):
            title = line[3:].strip()
            table = {"cast": "cast", "роли": "cast", "персонажи": "cast", "map": "map", "карта": "map"}.get(title.lower())
            if not table:
                scenes.append(Scene(title, None, None, n))
                items.append(scenes[-1])
        elif line.startswith("#") or not line:
            continue
        elif table and (m := ROW.match(line)):
            table_row(table, m[1], n, cast=cast, story=story, cols=cols)
        elif m := AMBIENCE.match(line):
            if not scenes:
                sys.exit(f"line {n}: '> ambience' needs a '## scene' heading above it")
            scenes[-1].ambience, scenes[-1].volume = m[1], float(m[2]) if m[2] else None
        elif m := ITEM.match(line):
            items.append(md_item(m[1].strip(), n, len(scenes) - 1))
        elif TURN.match(line) or PAUSE.match(line):
            sys.exit(f"line {n}: turns are list items, write '- {line}'")
    return Scenario(cast, scenes, items, story=story)


def table_row(table: str, row: str, n: int, *, cast: dict[str, str], story: list[Node], cols: list[str]) -> None:
    if table == "map":
        if node := map_row(row, n, cols):
            story.append(node)
        return
    voice, desc = [c.strip().strip("`") for c in row.split("|", 1)]
    if voice.lower() != "voice" and not set(voice) <= set("-: "):
        cast[voice] = desc.strip().strip("|").strip()


def map_row(row: str, n: int, cols: list[str]) -> Node | None:
    """One map row, by the header's column names; the header fills `cols` and returns None."""
    cells = [c.strip() for c in row.split("|")]
    if cells[0].lower() == "id":
        cols[:] = [c.lower() for c in cells]
        return None
    if not cols or set(cells[0]) <= set("-: "):
        return None
    cell = dict(zip(cols, cells, strict=False))

    def ids(name: str) -> list[str]:
        return [b.strip() for b in re.split(r"[,;]", cell.get(name, "")) if b.strip() and b.strip() not in ("-", "—")]

    return Node(
        cell.get("id", ""),
        cell.get("kind", "").lower(),
        cell.get("what", ""),
        ids("because"),
        cell.get("shown", ""),
        n,
        who=cell.get("who", "").strip("`"),
        knows=ids("knows"),
        via=cell.get("via", "").lower(),
    )


def md_item(body: str, n: int, scene: int) -> Turn | Pause | Ambience | Sfx:
    """One list item: a pause, an effect, a bed change or a turn."""
    if pm := PAUSE.match(body):
        return Pause(float(pm[1]), n)
    if fm := SFX.match(body):
        return sfx_item(fm, n)
    if bm := BED_CHANGE.match(body):
        return Ambience(bm[1], float(bm[2]) if bm[2] else None, n)
    if tm := TURN.match(body):
        return Turn(tm[1], tm[4], float(tm[3]) if tm[3] else None, n, scene, bool(tm[2]))
    sys.exit(f"line {n}: list item is not 'voice: text' or '{{pause N}}': {body}")


def sfx_item(m: re.Match[str], n: int) -> Sfx:
    return Sfx(m[1], float(m[2]) if m[2] else None, float(m[3]) if m[3] else None, n)


# Words that promise a sound, and the effect that delivers it. The lint warns when
# one is spoken with no {sfx} item within CUE_REACH items of the turn.
CUES = [
    (r"телефон\w*\s+(?:за)?звон|(?:за)?звон\w*\s+телефон|рингтон", "phone_ring"),
    (r"вибрир|вибрац", "phone_vibrate"),
    (r"модем|подключ\w* к интернет|dial-?up", "modem"),
    (r"стук\w*\s+в\s+двер|стуч\w*\s+в\s+двер|постучал", "door_knock"),
    (r"(?:открыл|открыв|распахн|скрипн)\w*\s+двер|двер\w*\s+(?:открыл|открыв|распахн|скрипн)", "door_open"),
    (r"(?:закрыл|закрыв|хлопн)\w*\s+двер|двер\w*\s+(?:закрыл|закрыв|хлопн)", "door_close"),
    (r"\bаськ|\bicq\b|\bо-оу\b", "uh_oh"),
    (r"\bзум\w*|\bzoom\b|подключил\w*\s+к\s+(?:звонку|созвону)", "call_join"),
    (r"зажигалк|закурил|прикурил|затянулся", "lighter"),
    (r"чайник", "kettle"),
    (r"\bкасс(?:а|ы|е|у|ой|овый)\b", "cash_register"),
    (r"уведомлени|пиликн|дзынь", "notify"),
]
CUE_REACH = 2


def spoken(text: str) -> str:
    """The words read aloud: text without [tags]."""
    return TAG.sub("", text).strip()


def names(desc: str) -> list[str]:
    """Capitalised words before the first comma: «Геннадий Палыч, IT-директор» -> both."""
    return [w for w in re.findall(r"[\w-]+", desc.split(",", 1)[0]) if w[0].isupper() and len(w) > 2]


def mentions(text: str, who: list[str]) -> bool:
    """Any name as a whole word, allowing a Russian case ending: Михалыч matches Михалыча,
    Мама matches Мам and маму; Стас does not match старый, Вадик does not match Вадим."""
    low = spoken(text).lower()
    return any(re.search(rf"\b{re.escape(stem(w))}\w{{0,3}}\b", low) for w in who)


def stem(name: str) -> str:
    """A name without its final vowel or soft sign, the part every case form keeps."""
    low = name.lower()
    return low[:-1] if low[-1] in "аяоеыйь" and len(low) > 3 else low


Issue = tuple[str, int, str]  # (level, line, message), level "error" or "warn"


def lint_text(sc: Scenario) -> list[Issue]:
    """Per-turn text checks and long pauses."""
    out: list[Issue] = []
    for t in sc.turns:
        if any(re.search(r"[а-яё]", tag, re.IGNORECASE) for tag in TAG.findall(t.text)):
            out.append(("error", t.line, "Russian inside [tag]: it is read aloud"))
        tags = " ".join(TAG.findall(t.text)).lower()
        if re.search(r"\b(?:too |very )?(?:fast|rapid|quick(?:ly)?|hurried)\b", tags):
            out.append(("warn", t.line, "speed tag: speech comes out machine-gunned; play panic or hurry in words and breaks"))
        if not tags:
            out.append(("warn", t.line, "no [delivery tag]: the line comes out read, not played"))
        if "?" in spoken(t.text) and not re.search(r"intonation|question", tags):
            out.append(("warn", t.line, "question without an intonation tag: comes out flat"))
        if len(re.findall(r"\[(?:short |long )?pause\]", t.text)) > 1:
            out.append(("warn", t.line, "several [pause] tags in one turn: dead air"))
        if re.search(r"bursts out laughing\]\s*\[(?:short )?pause\]", t.text):
            out.append(("warn", t.line, "[pause] after a burst laugh: too much spacing"))
        if (marks := spoken(t.text).count(STRESS)) > 2:
            out.append(("warn", t.line, f"{marks} stress marks: each adds emphasis, keep them to the words heard wrong"))
        if len(spoken(t.text)) > 300:
            out.append(("warn", t.line, f"{len(spoken(t.text))} characters: split it, one render caps near 47 s"))
    for i in sc.items:
        if isinstance(i, Pause) and i.secs > 3:
            out.append(("warn", i.line, f"{{pause {i.secs:g}}}: over 3 s reads as a dropout"))
    return out


def lint_cues(items: list[Item]) -> list[Issue]:
    """Sound cues: «звонит телефон» with no {sfx} next to it promises a sound that never comes."""
    out: list[Issue] = []
    warned: set[tuple[int, str]] = set()  # (scene, effect): once per scene is enough
    for k, t in enumerate(items):
        if not isinstance(t, Turn):
            continue
        near = items[max(0, k - CUE_REACH) : k + CUE_REACH + 1]
        if any(isinstance(i, Sfx) for i in near):
            continue
        for pattern, effect in CUES:
            if (m := re.search(pattern, spoken(t.text), re.IGNORECASE)) and (t.scene, effect) not in warned:
                warned.add((t.scene, effect))
                out.append(("warn", t.line, f"«{m[0]}» with no sound: add '- {{sfx {effect}}}' next to this turn"))
                break
    return out


def lint_names(sc: Scenario) -> list[Issue]:
    """Who is speaking: a voice is in the cast, named before or in its first line, and again in a
    scene it returns to after missing the previous one."""
    out: list[Issue] = []
    turns = sc.turns
    for v in sorted({t.voice for t in turns} - set(sc.cast) - {NARRATOR}):
        out.append(("error", next(t.line for t in turns if t.voice == v), f"{v} speaks but is not in the cast"))
    last_scene: dict[str, int] = {}
    for k, t in enumerate(turns):
        if t.voice == NARRATOR or t.voice not in sc.cast:
            continue
        who = names(sc.cast[t.voice])
        first = t.voice not in last_scene
        returning = not first and last_scene[t.voice] < t.scene - 1
        if (first or returning) and last_scene.get(t.voice) != t.scene:
            here = [u for u in turns[: k + 1] if first or u.scene == t.scene]
            if not any(mentions(u.text, who) for u in here):
                what = "first line" if first else "returns after a scene away"
                out.append(("warn", t.line, f"{t.voice} ({', '.join(who) or '?'}): {what}, never named"))
        last_scene[t.voice] = t.scene
    return out


def lint_scenes(sc: Scenario) -> list[Issue]:
    """Where and when: the narrator opens every scene, at most 4 speakers in it."""
    out: list[Issue] = []
    turns = sc.turns
    for s, scene in enumerate(sc.scenes):
        inside = [t for t in turns if t.scene == s]
        if not inside:
            out.append(("warn", scene.line, f"scene «{scene.title}» has no turns"))
            continue
        if inside[0].voice != NARRATOR:
            out.append(("warn", inside[0].line, f"scene «{scene.title}» opens without the narrator saying where and when"))
        speakers = {t.voice for t in inside} - {NARRATOR}
        if len(speakers) > 4:
            out.append(("warn", scene.line, f"scene «{scene.title}»: {len(speakers)} speakers, over 4 blur together"))
    return out


def seconds_at(sc: Scenario, line: int) -> float:
    """Estimated time a line of the file is heard, from the characters spoken before it."""
    return sum(len(spoken(t.text)) for t in sc.turns if t.line < line) / CHARS_PER_SEC


def lint_jokes(sc: Scenario) -> list[Issue]:
    """Callbacks: a plant before every echo and payoff, the last touch within reach, three touches at most."""
    out: list[Issue] = []
    last: dict[str, int] = {}  # key -> line of its latest plant or echo
    count: dict[str, int] = {}
    paid: set[str] = set()
    for kind, key, n in sc.marks:
        if kind not in ("plant", "echo", "payoff"):
            continue
        count[key] = count.get(key, 0) + 1
        if kind != "plant" and key not in last:
            out.append(("error", n, f"{kind} «{key}» has no plant before it in this episode: the listener never heard the setup"))
            continue
        if kind == "payoff" and (gap := seconds_at(sc, n) - seconds_at(sc, last[key])) > sc.rules.callback_reach:
            out.append(("warn", n, f"payoff «{key}» ~{gap:.0f} s after its last touch: echo it in between"))
        if kind == "payoff":
            paid.add(key)
        last[key] = n
        if count[key] == sc.rules.callback_max + 1:
            out.append(("warn", n, f"«{key}» returns a {count[key]}th time: past plant, echo, payoff it wears out"))
    out += [("warn", n, f"plant «{key}» is never paid off") for kind, key, n in sc.marks if kind == "plant" and key not in paid]
    return out


def lint_laughs(sc: Scenario) -> list[Issue]:
    """Joke density: a <!-- laugh: WHAT --> before every line meant to get one, none too far apart."""
    if not sc.rules.laughs_per_min:
        return []
    laughs = [n for kind, _, n in sc.marks if kind == "laugh"]
    if not laughs:
        return [("warn", 1, "no <!-- laugh: WHAT --> marks: the laughs are not designed, so nobody can count them")]
    total = seconds_at(sc, 10**9)
    out: list[Issue] = []
    if (per_min := len(laughs) / max(total / 60, 0.1)) < sc.rules.laughs_per_min:
        out.append(
            ("warn", 1, f"{len(laughs)} laughs in ~{total / 60:.1f} min, {per_min:.1f}/min: aim for {sc.rules.laughs_per_min:g}/min")
        )
    for a, b in pairwise([0, *laughs, 10**9]):
        if (gap := seconds_at(sc, b) - seconds_at(sc, a)) > sc.rules.laugh_gap:
            out.append(("warn", a or 1, f"~{gap:.0f} s without a laugh after this line: punch up a line in between"))
    return out


def lint_beats(sc: Scenario) -> list[Issue]:
    """The episode template: needed beats present, in order, the ladder at least two rungs."""
    beats = [(key, n) for kind, key, n in sc.marks if kind == "beat"]
    if not beats:
        return [("warn", 1, "no <!-- beat: NAME --> marks: the episode's structure is not designed")]
    out: list[Issue] = [
        ("warn", n, f"unknown beat «{key}»; beats: {', '.join(sc.rules.beats)}") for key, n in beats if key not in sc.rules.beats
    ]
    known = [(key, n) for key, n in beats if key in sc.rules.beats]
    out += [
        ("warn", n, f"beat «{key}» comes after «{prev}»")
        for (prev, _), (key, n) in pairwise(known)
        if sc.rules.beats.index(key) < sc.rules.beats.index(prev)
    ]
    names = [key for key, _ in known]
    out += [("warn", 1, f"no «{key}» beat") for key in sc.rules.needed if key not in names]
    out += [("warn", n, f"a second «{key}» beat") for k, (key, n) in enumerate(known) if key != "ladder" and key in names[:k]]
    if names.count("ladder") < sc.rules.min_rungs:
        out.append(("warn", 1, f"{names.count('ladder')} ladder rung(s): heighten at least twice"))
    total = seconds_at(sc, 10**9) or 1
    spent: dict[str, float] = {}
    for (key, n), (_, nxt) in pairwise([*known, ("", 10**9)]):
        spent[key] = spent.get(key, 0) + seconds_at(sc, nxt) - seconds_at(sc, n)
    for key, secs in spent.items():
        share = sc.rules.shares.get(key)
        if share and not share / 2 <= secs / total <= share * 2:
            out.append(("warn", 1, f"beat «{key}» ~{secs:.0f} s, {secs / total:.0%} of the episode against ~{share:.0%}"))
    if "button" in names:  # the button's last turn is the punchline: short, the funny word last
        start = dict(reversed(known))["button"]
        end = next((n for k, n in known if n > start), 10**9)
        inside = [t for t in sc.turns if start < t.line < end]
        if inside and (words := len(spoken(inside[-1].text).split())) > sc.rules.button_words:
            out.append(("warn", inside[-1].line, f"button ends on {words} words: keep the last line under {sc.rules.button_words + 1}"))
    return out


def lint_spoken_length(sc: Scenario) -> list[Issue]:
    """Sentence lengths against real TV dialogue: setups need full sentences, only punches are short."""
    lengths = [
        len(re.findall(r"\w+", x))
        for t in sc.turns
        if t.voice != "narrator"
        for x in re.split(r"(?<=[.!?…])\s+", spoken(t.text))
        if re.search(r"\w", x)
    ]
    if len(lengths) < 40:
        return []
    clipped = sum(n <= 3 for n in lengths) / len(lengths)
    long = sum(n >= 10 for n in lengths) / len(lengths)
    out: list[Issue] = []
    if clipped > sc.rules.clipped_max:
        out.append(("warn", 1, f"{clipped:.0%} of dialogue sentences are 1-3 words (TV: ~49%): join setups into spoken sentences (T12)"))
    if long < sc.rules.long_min:
        out.append(
            ("warn", 1, f"{long:.0%} of dialogue sentences are 10+ words (TV: ~8%): people explain at length before the punch (T12)")
        )
    return out


QUESTION_WORD = re.compile(r"(Что|Кто|Где|Куда|Откуда|Когда|Как|Зачем|Почему|Сколько|Как(?:ой|ая|ое|ие)|Ч(?:ей|ья|ьё|ьи))\b")


def lint_question_order(sc: Scenario) -> list[Issue]:
    """A statement that opens with a question word: the voice starts a question, then drops it (T13)."""
    out: list[Issue] = []
    for t in sc.turns:
        for x in re.split(r"(?<=[.!?…])\s+", spoken(t.text)):
            if QUESTION_WORD.match(x.lstrip("«— ")) and x.rstrip("»").endswith((".", "…")):
                out.append(("warn", t.line, f"«{x}» opens like a question and ends as a statement: put the clause in speech order (T13)"))
    return out


def registry(profile: Path) -> dict[str, str]:
    """The series' voices: `characters.md`'s first `| voice | who |` table, voice -> description."""
    f = profile / "characters.md"
    rows: dict[str, str] = {}
    for line in f.read_text().splitlines() if f.exists() else []:
        if m := ROW.match(line.strip()):
            voice, desc = [c.strip().strip("`") for c in m[1].split("|", 1)]
            if voice.lower() != "voice" and not set(voice) <= set("-: "):
                rows[voice] = desc.strip().strip("|").strip()
        elif rows:
            break
    return rows


def lint_casting(sc: Scenario) -> list[Issue]:
    """One voice, one person (C6): no voice lent to another character, no two voices from one
    file, no two cast voices the similarity check scores as one speaker."""
    import hashlib

    import voices

    if not sc.profile:
        return []
    out: list[Issue] = []
    known = registry(sc.profile)
    for v, desc in sc.cast.items():
        owner = names(known.get(v, ""))
        if owner and not set(owner) & set(names(desc)):
            who = desc.split(",")[0]
            out.append(("warn", 1, f"voice {v} is {' '.join(owner)}'s in characters.md: {who} needs a voice of their own (C6)"))
    used = sorted(set(sc.cast) | {t.voice for t in sc.turns})
    files = {v: f for v in used if (f := voices.find(v, [sc.profile / "voices"]))}
    digest = {v: hashlib.sha1(f.read_bytes(), usedforsecurity=False).hexdigest() for v, f in files.items()}
    for a, b in combinations(sorted(digest), 2):
        if digest[a] == digest[b]:
            out.append(("warn", 1, f"voices {a} and {b} are the same recording: one person to the ear (C6)"))
    f = sc.profile / "voices" / "similarity.json"
    if not f.exists():
        return [*out, ("warn", 1, "no voices/similarity.json: run voice_similarity.py to check the cast is told apart (C6)")]
    sim = json.loads(f.read_text())
    if stale := sorted(v for v in digest if sim["voices"].get(v, {}).get("sha1") != digest[v]):
        out.append(("warn", 1, f"voices/similarity.json predates {', '.join(stale)}: rerun voice_similarity.py (C6)"))
    for a, b in combinations(sorted(digest), 2):
        score = sim["pairs"].get(f"{a}|{b}")
        if score is None or score <= sc.rules.voice_sim_max or digest[a] == digest[b]:
            continue
        fa, fb = (sim["voices"].get(v, {}).get("f0_hz") for v in (a, b))
        gap = abs(12 * math.log2(fa / fb)) if fa and fb else 0
        if gap < sc.rules.voice_pitch_apart:
            over = f"over {sc.rules.voice_sim_max:g}, {gap:.1f} semitones apart"
            out.append(("warn", 1, f"voices {a} and {b} score {score:.2f} ({over}): too close to tell apart, redesign one (C6)"))
    return out


def lint_pace(sc: Scenario) -> list[Issue]:
    """Scene budget by length: each cut costs an audio listener a reorientation."""
    minutes = sum(len(spoken(t.text)) for t in sc.turns) / CHARS_PER_SEC / 60
    budget = max(2, math.ceil(minutes * sc.rules.scenes_per_min))
    out: list[Issue] = []
    if (target := sc.length or sc.rules.length) and abs(minutes - target) > 0.25 * target:
        out.append(("warn", 1, f"~{minutes:.1f} min against a {target:g} min target (±25%)"))
    if len(sc.cast) > sc.rules.cast_max:
        out.append(("warn", 1, f"{len(sc.cast)} voices in the cast: over {sc.rules.cast_max} the ear loses them"))
    if len(sc.scenes) > budget:
        too_many = f"{len(sc.scenes)} scenes in ~{minutes:.1f} min, budget {budget}: merge scenes that do not cross a threshold"
        out.append(("warn", sc.scenes[0].line, too_many))
    return out


def scene_of(sc: Scenario, shown: str) -> int | None:
    """Index of the scene a map node is shown in; None for `later` or no match."""
    s = shown.lower()
    if s.startswith("later"):
        return None
    titles = [x.title.lower() for x in sc.scenes]
    if s in titles:
        return titles.index(s)
    return next((i for i, x in enumerate(titles) if s in x or x in s), None)


def lint_story(sc: Scenario) -> list[Issue]:
    """The story map: why (motive), when (order), who knows (knowledge), how (means)."""
    if not sc.story:
        return [("warn", 1, "no ## Map: list the wants, lies, acts and facts and why each is there (SKILL.md 4a)")]
    out: list[Issue] = []
    by_id = {node.id: node for node in sc.story}
    used = {b for node in sc.story for b in node.because + node.knows}
    used |= {i for kind, key, _ in sc.marks if kind == "needs" for i in ids(key)}  # a fact a laugh stands on is used
    for node in sc.story:
        out += lint_node(sc, node, by_id)
        if node.kind in {"want", "fear", "fact", "rule", "plant"} and node.id not in used:
            out.append(("warn", node.line, f"map «{node.id}»: nothing follows from this {node.kind}: an unfired gun, or cut it"))
    return out


def ids(key: str) -> list[str]:
    return [x for x in re.split(r"[,\s]+", key) if x and x != "-"]


def lint_needs(sc: Scenario) -> list[Issue]:
    """What the listener must already have heard for a laugh to work, and that they have."""
    if not sc.story:
        return []
    by_id = {node.id: node for node in sc.story}
    turns = sc.turns

    def turn_of(n: int) -> Turn | None:  # a mark on a turn's line, or on its own line before it
        return next((t for t in turns if t.line >= n), None)

    told: dict[str, int] = {}
    out: list[Issue] = []
    for kind, key, n in sc.marks:
        if kind == "shows" and not (bad := lint_shows(sc, key, turn_of(n), n, by_id)):
            told.update({i: min(t.line, told.get(i, t.line)) for i in ids(key) if (t := turn_of(n))})  # the first telling counts
        elif kind == "shows":
            out += bad
    needs = {t.line: key for kind, key, n in sc.marks if kind == "needs" and (t := turn_of(n))}
    for line, key in needs.items():
        turn = next(t for t in turns if t.line == line)
        out += [x for i in ids(key) if (x := lint_need(sc, i, turn, by_id, told))]
    laughs = {t.line for kind, _, n in sc.marks if kind == "laugh" and (t := turn_of(n))}
    bare = "laugh without <!-- needs: ids -->: what must the listener already know? (`needs: -` for nothing)"
    return out + [("warn", n, bare) for n in sorted(laughs - needs.keys())]


def lint_shows(sc: Scenario, key: str, turn: Turn | None, n: int, by_id: dict[str, Node]) -> list[Issue]:
    if turn is None:
        return [("error", n, "<!-- shows: --> goes on the turn that tells the listener")]
    out: list[Issue] = []
    for i in ids(key):
        if i not in by_id:
            out.append(("error", n, f"shows «{i}»: not in the map"))
        elif scene_of(sc, by_id[i].shown) != turn.scene:
            out.append(("error", n, f"shows «{i}»: the map says it is shown in «{by_id[i].shown}», not this scene"))
    return out


def lint_need(sc: Scenario, i: str, turn: Turn, by_id: dict[str, Node], told: dict[str, int]) -> Issue | None:
    n = turn.line
    if i not in by_id:
        return ("error", n, f"needs «{i}»: not in the map")
    node = by_id[i]
    s = scene_of(sc, node.shown)
    if s is None:
        return ("error", n, f"needs «{i}», but the listener hears it {node.shown or 'never'}: the laugh has nothing to stand on")
    if s > turn.scene:
        return ("error", n, f"needs «{i}», heard only in a later scene «{node.shown}»")
    if s == turn.scene and i not in told:
        return ("warn", n, f"needs «{i}», told in this same scene: mark the line that tells it with <!-- shows: {i} -->")
    if s == turn.scene and told[i] > n:  # the same line may tell and pay off
        return ("error", n, f"needs «{i}», told at line {told[i]}: after the laugh that needs it")
    return None


def issue(node: Node, kind: str, msg: str) -> Issue:
    return (kind, node.line, f"map «{node.id}»: {msg}")


def lint_node(sc: Scenario, node: Node, by_id: dict[str, Node]) -> list[Issue]:
    return lint_why(sc, node, by_id) + lint_when(sc, node, by_id) + lint_how(sc, node)


def lint_why(sc: Scenario, node: Node, by_id: dict[str, Node]) -> list[Issue]:
    """Motive: every act has a reason, and every node is shown or justified later."""
    out: list[Issue] = []
    if node.kind not in KINDS:
        out.append(issue(node, "error", f"kind «{node.kind}» is not one of {', '.join(sorted(KINDS))}"))
    if node.kind in ACTS and not node.because:
        out.append(issue(node, "error", f"this {node.kind} has no reason: why does it happen?"))
    out += [issue(node, "error", f"«{dep}» is not in the map") for dep in node.because + node.knows if dep not in by_id]
    shown = node.shown.lower()
    if shown.startswith("later"):
        if not shown.removeprefix("later").strip(" :"):
            out.append(issue(node, "error", "«later» needs where: `later: ep03` or `later: the finale`"))
    elif scene_of(sc, node.shown) is None:
        out.append(issue(node, "error", f"shown «{node.shown}» is not a scene of this episode, nor `later: WHERE`"))
    return out


def lint_when(sc: Scenario, node: Node, by_id: dict[str, Node]) -> list[Issue]:
    """Order: a cause, or what `who` must know, is heard no later than what it explains."""
    here = scene_of(sc, node.shown)
    if here is None:
        return []
    late = [d for d in node.because + node.knows if d in by_id and (s := scene_of(sc, by_id[d].shown)) is not None and s > here]
    return [issue(node, "error", f"«{d}» is heard in a later scene than this: the effect comes before its cause") for d in late]


def lint_how(sc: Scenario, node: Node) -> list[Issue]:
    """Means: how it reaches `who`, and whether they are there to get it that way."""
    out: list[Issue] = []
    if node.via and node.via not in VIA:
        out.append(issue(node, "error", f"via «{node.via}» is not one of {', '.join(sorted(VIA))}"))
    if node.who and node.who != "narrator" and node.who not in sc.cast:
        out.append(issue(node, "error", f"who «{node.who}» is not in the cast"))
    here = scene_of(sc, node.shown)
    if not node.who or here is None:
        return out
    turns = [x for x in sc.turns if x.voice == node.who and x.scene == here]
    if node.via == "room" and turns and all(x.phone for x in turns):
        out.append(issue(node, "error", f"{node.who} is only on the phone in this scene: they cannot do this in the room"))
    if node.via == "phone" and not any(x.phone for x in sc.turns if x.scene == here):
        out.append(issue(node, "error", "via phone, but nobody in this scene is on the phone"))
    return out


def lint(sc: Scenario) -> list[Issue]:
    out = lint_text(sc) + lint_cues(sc.items)
    if sc.jingle:
        pass
    elif not sc.cast:
        out.append(("warn", 1, "no cast (## Cast table or @cast): intro checks skipped"))
    else:
        out += lint_names(sc) + lint_scenes(sc) + lint_jokes(sc) + lint_laughs(sc) + lint_beats(sc) + lint_pace(sc)
        out += lint_story(sc) + lint_needs(sc) + lint_spoken_length(sc) + lint_question_order(sc)
        out += lint_casting(sc)
    out = [i for i in out if i[0] == "error" or not any(q in i[2] for q in sc.quiet)]  # <!-- lint-ok: words -->
    return sorted(out, key=lambda x: x[1])


def report(issues: list[Issue], src: str) -> bool:
    """Print issues; True when there are no errors."""
    for level, n, msg in issues:
        print(f"[perform] lint {level}: {src}:{n}: {msg}", flush=True)
    return not any(level == "error" for level, _, _ in issues)


if __name__ == "__main__":
    src = sys.argv[1]
    issues = lint(load(src))
    ok = report(issues, src)
    print(
        f"[perform] lint: {sum(level == 'error' for level, _, _ in issues)} errors, "
        f"{sum(level == 'warn' for level, _, _ in issues)} warnings"
    )
    sys.exit(0 if ok else 1)
