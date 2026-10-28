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
Errors stop a render; warnings are printed.

Usage: uv run scenario.py scene.txt   (exit 1 on errors)
"""
import re
import sys
from dataclasses import dataclass
from pathlib import Path

TURN = re.compile(r"^([\w-]+)(\+phone)?(?:@(-?[\d.]+))?\s*:\s*(.+)$")
PAUSE = re.compile(r"^\{pause\s+([\d.]+)\}$")
BED_CHANGE = re.compile(r"^\{ambience\s+([\w-]+)(?:\s+([\d.]+))?\}$")
SFX = re.compile(r"^\{sfx\s+([\w-]+)(?:\s+([\d.]+))?(?:\s*@(-?[\d.]+))?\}$")
SCENE = re.compile(r"^@scene\s+(.+?)(?:\s*\|\s*ambience\s+([\w-]+)(?:\s+([\d.]+))?)?\s*$")
CAST_LINE = re.compile(r"^([\w-]+)\s*\|\s*(.+)$")
TAG = re.compile(r"\[([^\]]*)\]")
NARRATOR = "narrator"


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


@dataclass
class Scenario:
    cast: dict[str, str]  # voice -> description
    scenes: list[Scene]
    items: list[Turn | Pause | Scene | Ambience | Sfx]  # in order; Scene marks where it starts

    @property
    def turns(self) -> list[Turn]:
        return [i for i in self.items if isinstance(i, Turn)]


def parse(text: str) -> Scenario:
    cast, scenes, items, in_cast = {}, [], [], False
    for n, line in enumerate(text.splitlines(), 1):
        line = line.strip()
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
    return sc


ITEM = re.compile(r"^[-*]\s+(.+)$")
AMBIENCE = re.compile(r"^>\s*ambience\s+([\w-]+)(?:\s+([\d.]+))?\s*$")
ROW = re.compile(r"^\|(.+)\|$")


def parse_md(text: str) -> Scenario:
    # Comments become blank lines, so line numbers in lint messages stay right.
    text = re.sub(r"<!--.*?-->", lambda m: "\n" * m[0].count("\n"), text, flags=re.S)
    cast, scenes, items, in_cast = {}, [], [], False
    for n, line in enumerate(text.splitlines(), 1):
        line = line.strip()
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
            body = m[1].strip()
            if pm := PAUSE.match(body):
                items.append(Pause(float(pm[1]), n))
            elif fm := SFX.match(body):
                items.append(sfx_item(fm, n))
            elif bm := BED_CHANGE.match(body):
                items.append(Ambience(bm[1], float(bm[2]) if bm[2] else None, n))
            elif tm := TURN.match(body):
                items.append(Turn(tm[1], tm[4], float(tm[3]) if tm[3] else None, n, len(scenes) - 1,
                                  bool(tm[2])))
            else:
                sys.exit(f"line {n}: list item is not 'voice: text' or '{{pause N}}': {body}")
        elif TURN.match(line) or PAUSE.match(line):
            sys.exit(f"line {n}: turns are list items, write '- {line}'")
    return Scenario(cast, scenes, items)


def sfx_item(m: re.Match, n: int) -> Sfx:
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
    return [w for w in re.findall(r"[\w-]+", desc.split(",")[0]) if w[0].isupper() and len(w) > 2]


def mentions(text: str, who: list[str]) -> bool:
    """Any name, allowing a Russian case ending: Михалыч matches Михалыча, Михалычу."""
    low = spoken(text).lower()
    return any(re.search(rf"\b{re.escape(w.lower()[:max(3, len(w) - 1)])}", low) for w in who)


def lint(sc: Scenario) -> list[tuple[str, int, str]]:
    """(level, line, message), level "error" or "warn"."""
    out = []
    err = lambda n, m: out.append(("error", n, m))
    warn = lambda n, m: out.append(("warn", n, m))
    turns = sc.turns

    for t in turns:
        if any(re.search(r"[а-яё]", tag, re.I) for tag in TAG.findall(t.text)):
            err(t.line, "Russian inside [tag]: it is read aloud")
        tags = " ".join(TAG.findall(t.text)).lower()
        if spoken(t.text).rstrip("»\"' ").endswith("?") and not re.search(r"intonation|question", tags):
            warn(t.line, "question without an intonation tag: comes out flat")
        if len(re.findall(r"\[(?:short )?pause\]", t.text)) > 1:
            warn(t.line, "several [pause] tags in one turn: dead air")
        if re.search(r"bursts out laughing\]\s*\[(?:short )?pause\]", t.text):
            warn(t.line, "[pause] after a burst laugh: too much spacing")
        if len(spoken(t.text)) > 300:
            warn(t.line, f"{len(spoken(t.text))} characters: split it, one render caps near 47 s")
    for i in sc.items:
        if isinstance(i, Pause) and i.secs > 3:
            warn(i.line, f"{{pause {i.secs:g}}}: over 3 s reads as a dropout")

    # Sound cues: «звонит телефон» with no {sfx} next to it promises a sound that never comes.
    items = sc.items
    for k, t in enumerate(items):
        if not isinstance(t, Turn):
            continue
        near = items[max(0, k - CUE_REACH):k + CUE_REACH + 1]
        if any(isinstance(i, Sfx) for i in near):
            continue
        for pattern, effect in CUES:
            if m := re.search(pattern, spoken(t.text), re.I):
                warn(t.line, f"«{m[0]}» with no sound: add '- {{sfx {effect}}}' next to this turn")
                break

    if getattr(sc, "jingle", False):
        return sorted(out, key=lambda x: x[1])
    if not sc.cast:
        warn(1, "no cast (## Cast table or @cast): intro checks skipped")
        return sorted(out, key=lambda x: x[1])
    for v in sorted({t.voice for t in turns} - set(sc.cast) - {NARRATOR}):
        err(next(t.line for t in turns if t.voice == v), f"{v} speaks but is not in the cast")

    # Who is speaking: a voice is named before or in its first line, and again in a
    # scene it returns to after missing the previous one.
    last_scene = {}
    for k, t in enumerate(turns):
        if t.voice == NARRATOR or t.voice not in sc.cast:
            continue
        who = names(sc.cast[t.voice])
        first = t.voice not in last_scene
        returning = not first and last_scene[t.voice] < t.scene - 1
        if (first or returning) and last_scene.get(t.voice) != t.scene:
            here = [u for u in turns[:k + 1] if first or u.scene == t.scene]
            if not any(mentions(u.text, who) for u in here):
                what = "first line" if first else "returns after a scene away"
                warn(t.line, f"{t.voice} ({', '.join(who) or '?'}): {what}, never named")
        last_scene[t.voice] = t.scene

    # Where and when: the narrator opens every scene, at most 4 speakers in it.
    for s, scene in enumerate(sc.scenes):
        inside = [t for t in turns if t.scene == s]
        if not inside:
            warn(scene.line, f"scene «{scene.title}» has no turns")
            continue
        if inside[0].voice != NARRATOR:
            warn(inside[0].line, f"scene «{scene.title}» opens without the narrator saying where and when")
        speakers = {t.voice for t in inside} - {NARRATOR}
        if len(speakers) > 4:
            warn(scene.line, f"scene «{scene.title}»: {len(speakers)} speakers, over 4 blur together")
    return sorted(out, key=lambda x: x[1])


def report(issues, src: str) -> bool:
    """Print issues; True when there are no errors."""
    for level, n, msg in issues:
        print(f"[perform] lint {level}: {src}:{n}: {msg}", flush=True)
    return not any(level == "error" for level, _, _ in issues)


if __name__ == "__main__":
    src = sys.argv[1]
    issues = lint(load(src))
    ok = report(issues, src)
    print(f"[perform] lint: {sum(l == 'error' for l, _, _ in issues)} errors, "
          f"{sum(l == 'warn' for l, _, _ in issues)} warnings")
    sys.exit(0 if ok else 1)
