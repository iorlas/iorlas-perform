"""Scenario format: a cast block, scene headers and turns. Parser and lint.

    # Title
    @cast
    vadik     | Вадик, 28, тимлид третью неделю
    mikhalych | Михалыч, старый сисадмин, курит у сервера Зинаида

    @scene Офис, утро | ambience office
    narrator: [calm] Утро. Офис...
    vadik@0.2: [nervous] Сделаем.
    {pause 2}

`@cast` lists every voice except `narrator`: `voice | Name, who they are`. The
words before the first comma are the names the lint looks for. `@scene place,
time | ambience NAME [volume]` starts a scene; the ambience part is optional.
Turns and `{pause N}` are as before; files without `@cast` or `@scene` still
parse, and the lint then skips the checks that need them.

Lint, from radio-drama craft (stories/research_audio_drama_craft.md in the
playground): a listener with closed eyes must know who speaks, where and when.
Errors stop a render; warnings are printed.

Usage: uv run scenario.py scene.txt   (exit 1 on errors)
"""
import re
import sys
from dataclasses import dataclass
from pathlib import Path

TURN = re.compile(r"^([\w-]+)(?:@(-?[\d.]+))?\s*:\s*(.+)$")
PAUSE = re.compile(r"^\{pause\s+([\d.]+)\}$")
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


@dataclass
class Pause:
    secs: float
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
    items: list[Turn | Pause | Scene]  # in order; Scene marks where it starts

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
        elif m := TURN.match(line):
            items.append(Turn(m[1], m[3], float(m[2]) if m[2] else None, n, len(scenes) - 1))
        else:
            sys.exit(f"line {n}: expected 'voice: text', '{{pause N}}', '@cast' or '@scene ...': {line}")
    return Scenario(cast, scenes, items)


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

    if not sc.cast:
        warn(1, "no @cast: intro checks skipped")
        return sorted(out, key=lambda x: x[1])
    for v in sorted({t.voice for t in turns} - set(sc.cast) - {NARRATOR}):
        err(next(t.line for t in turns if t.voice == v), f"{v} speaks but is not in @cast")

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
    issues = lint(parse(Path(src).read_text()))
    ok = report(issues, src)
    print(f"[perform] lint: {sum(l == 'error' for l, _, _ in issues)} errors, "
          f"{sum(l == 'warn' for l, _, _ in issues)} warnings")
    sys.exit(0 if ok else 1)
