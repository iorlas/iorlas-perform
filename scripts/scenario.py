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
from itertools import pairwise
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
MARK = re.compile(r"<!--\s*(plant|echo|payoff|beat|length|lint-ok):\s*(.+?)\s*-->")
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
class Scenario:
    cast: dict[str, str]  # voice -> description
    scenes: list[Scene]
    items: list[Item]  # in order; Scene marks where it starts
    jingle: bool = False  # `<!-- lint: jingle -->`, set by load()
    marks: list[tuple[str, str, int]] = field(default_factory=list)  # (kind, key, line) from <!-- kind: key -->
    length: float | None = None  # `<!-- length: 4.5 -->`, target minutes
    quiet: list[str] = field(default_factory=list)  # `<!-- lint-ok: words -->`: warnings containing them are dropped
    rules: Rules = field(default_factory=Rules)

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
    in_cast = False
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if line.startswith("## "):
            title = line[3:].strip()
            in_cast = title.lower() in ("cast", "роли", "персонажи")
            if not in_cast:
                scenes.append(Scene(title, None, None, n))
                items.append(scenes[-1])
        elif line.startswith("#") or not line:
            continue
        elif in_cast and (m := ROW.match(line)):
            voice, desc = [c.strip().strip("`") for c in m[1].split("|", 1)]
            if voice.lower() != "voice" and not set(voice) <= set("-: "):
                cast[voice] = desc.strip().strip("|").strip()
        elif m := AMBIENCE.match(line):
            if not scenes:
                sys.exit(f"line {n}: '> ambience' needs a '## scene' heading above it")
            scenes[-1].ambience, scenes[-1].volume = m[1], float(m[2]) if m[2] else None
        elif m := ITEM.match(line):
            items.append(md_item(m[1].strip(), n, len(scenes) - 1))
        elif TURN.match(line) or PAUSE.match(line):
            sys.exit(f"line {n}: turns are list items, write '- {line}'")
    return Scenario(cast, scenes, items)


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


def lint(sc: Scenario) -> list[Issue]:
    out = lint_text(sc) + lint_cues(sc.items)
    if sc.jingle:
        return sorted(out, key=lambda x: x[1])
    if not sc.cast:
        out.append(("warn", 1, "no cast (## Cast table or @cast): intro checks skipped"))
        return sorted(out, key=lambda x: x[1])
    out += lint_names(sc) + lint_scenes(sc) + lint_jokes(sc) + lint_beats(sc) + lint_pace(sc)
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
