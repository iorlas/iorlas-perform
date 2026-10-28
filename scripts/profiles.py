"""Profiles: one folder per series or world, everything a scenario needs.

    <profiles>/<name>/
      profile.md      what the series is: format, length, language, tone, intro, acting taste
      world.md        setting, entities, rules of the world, running gags, canon so far
      characters.md   cast table, character design, relationships, how each one sounds
      relationships.md every pair that makes plots: what goes on, the move, status, what flips it
      entities/       <id>.md soul files for every character, object, place and institution
      structure.json  optional: tunes the lint's structure rules for this genre (scenario.Rules)
      levels.json     per-voice loudness and pitch, written by calibrate.py
      voices/         <voice>.wav + <voice>.txt for this cast
      episodes/       NN-slug.md scenarios, in order; 00-intro.md plays before each one
      renders/        what scene.py renders from this profile's episodes

Profiles are your own work and never live in the plugin's repository or install folder.
They live in the plugin's data folder, ~/.claude/plugins/data/<plugin>-<marketplace>/profiles
(Claude Code's ${CLAUDE_PLUGIN_DATA}, kept across plugin updates), or in $PERFORM_PROFILES.
Uninstalling the plugin deletes its data folder unless you pass --keep-data: back it up, or
point $PERFORM_PROFILES somewhere you keep.

Usage: uv run profiles.py                 list profiles and where they live
       uv run profiles.py NAME            show a profile's files and episodes
       uv run profiles.py new NAME        create a profile from the template
       uv run profiles.py fact NAME ID SRC "text"   append a dated fact to entities/ID.md
                                          (ID relationships: to relationships.md)
       uv run profiles.py facts NAME [SRC] list the facts, all or from one source
       uv run profiles.py unfact NAME SRC  remove every fact from one source (an episode, a chat)

Facts are what episodes and conversations add after the design, one dated line each with its
source (`ep01`, `user`, `design`), under `## Facts` at the end of the file. The design above
them stays as written, so what was added, when and from where can always be seen and undone.
"""

import datetime as dt
import os
import re
import sys
from pathlib import Path

PLUGIN = "iorlas-perform"
MARKETPLACE = "iorlas-marketplace"  # used when running from a checkout, not an install
FILES = ("profile.md", "world.md", "characters.md", "relationships.md")
FACTS = "## Facts"
FACT = re.compile(r"^- (\d{4}-\d\d-\d\d) · (\S+) · (.*)$")  # - 2026-10-28 · ep01 · text
FACTS_HINT = (
    "Added after the design, oldest first: date · source · fact. "
    "`profiles.py fact` appends, `profiles.py unfact NAME SRC` removes a source's facts.\n"
)
INTRO = "00-intro.md"  # played before every episode by scene.py


TEMPLATE = {
    "profile.md": """# {name}

What the series is, in two lines: who, where, what kind of funny or scary or sad.

## Format

- Length: target minutes per episode (the lint's default structure suits 3-6 min shorts;
  tune it in structure.json).
- Intro: does every episode open with `episodes/00-intro.md`? What it is, what it must not be.
- Narration: who narrates and how (dry, warm, absent).
- Standalone or serial: closed episodes that reset, or a hook in the tag.

## Language

- Register: how people talk here (casual spoken, slang, jargon, swearing, accents). Reviews
  never make a line more formal than this.

## Tone and humour

- Audience, tone, what is in and out of bounds; how sharp the edgiest moment is, with one
  example line as the reference.
- Running-gag cap per episode.

## Acting

- Delivery habits for this cast: laughs, accents, how emotional the reads are.
""",
    "world.md": """# World

## Setting

- Where and when, in a few concrete details a listener can hear.

## Entities

Things, places and institutions that make plots, designed like characters.

| entity | what it is | plot function | touches | rule |
|---|---|---|---|---|
| | | | | |

## Rules of the world

- What is always true here; a rule is obeyed every time it comes up.

## Running gags

-

## Canon so far

""",
    "characters.md": """# Characters

Copy rows from this table into an episode's `## Cast`. The words before the first comma are
the names the lint looks for.

| voice | who |
|---|---|
| hero | Имя, кто это |

## Design

| character | wants | flaw | comic lens: how they misread the world | does to the hero | status |
|---|---|---|---|---|---|
| | | | | | |

Pairs and their dynamics are in `relationships.md`.

## How each one sounds

- **Имя** (`hero`): voice, tics, fillers, catchphrase (rare). The soul is in `entities/hero.md`.
""",
    "relationships.md": """# Relationships

Every pair that makes plots: characters, and characters with entities (a server, a
company). Each episode puts one or two under pressure; a pair gets a scene only if its
dynamic moves the plot. Each side's inner view (what it hides, what it wants) is in its
soul file's Connections.

| pair | what goes on between them | the recurring move | who starts high | what flips it |
|---|---|---|---|---|
| | | | | |

## Facts

{facts}""",
    "entities/hero.md": """# Имя (`hero`): character

One soul file per entity: a character, or an object, place or institution that is more
than a name in the story. Sections an object or place cannot have (speech) become how it
sounds.

## Core

What it is and what makes it it, in one paragraph.

## Charm

Why the listener loves it despite everything.

## Want, fear, wound (a character) / plot function and rule (a thing or place)

-

## Comic lens

How it misreads the world, or what comedy it makes; the go-to move under pressure.

## Culture

The real subcultures it comes from and what each gives it; what it would never know.

## Milieu

What surrounds a person or thing like this in real life: the type (who such people really
are), their objects, places, rituals, sayings, smells and sounds; what makes them work and
what breaks them. Real references only.

## Speech (or how it sounds)

Rhythm and pace, vocabulary, fillers, slang. How it lies, panics, asks, brags, apologises;
words it never uses. Edge: what of its culture it says out loud. Explicit language: its own
words, how often, at whom, never with whom; for or against it; learned from whom, if anyone.

## Lines that are it

-

## Lines that are not it

- (and why)

## Voice direction

Delivery tags that fit, tags to avoid; for a thing, its ambience and effects.

## Connections

How it relates to each main character and entity: status, what it hides, what it wants.

## Facts

{facts}""",
}


def data_dir() -> Path:
    """The plugin's data folder: ${CLAUDE_PLUGIN_DATA} when Claude Code exports it, else its known path."""
    # Hooks and MCP servers get ${CLAUDE_PLUGIN_DATA}; a shell may carry another plugin's, so check the name.
    if (env := os.environ.get("CLAUDE_PLUGIN_DATA")) and Path(env).name.startswith(f"{PLUGIN}-"):
        return Path(env)
    # Installed: .../plugins/cache/<marketplace>/<plugin>/<version>/scripts/profiles.py
    parts = Path(__file__).resolve().parts
    market = parts[parts.index("cache") + 1] if "cache" in parts else MARKETPLACE
    return Path.home() / ".claude" / "plugins" / "data" / re.sub(r"[^\w-]", "-", f"{PLUGIN}@{market}")


def user_dir() -> Path:
    return Path(os.environ.get("PERFORM_PROFILES") or data_dir() / "profiles").expanduser()


def find(name: str) -> Path | None:
    for prof in (user_dir() / name, Path(name).expanduser()):
        if (prof / "profile.md").exists():
            return prof
    return None


def writable(name: str) -> Path:
    """A profile to write into, by name or folder; exits when there is none."""
    prof = find(name)
    if prof is None:
        sys.exit(f"no profile: {name} (create one: profiles.py new NAME)")
    return prof


def of(path: str | Path) -> Path | None:
    """The profile a scenario file belongs to: the nearest parent with profile.md."""
    for folder in Path(path).resolve().parents:
        if (folder / "profile.md").exists():
            return folder
    return None


def available() -> list[Path]:
    return sorted(p.parent for p in user_dir().glob("*/profile.md"))


def episodes(profile: Path) -> list[Path]:
    return sorted((profile / "episodes").glob("*.md"))


def fact_file(profile: Path, ident: str) -> Path:
    path = profile / ("relationships.md" if ident == "relationships" else f"entities/{ident}.md")
    if not path.exists():
        sys.exit(f"no file: {path} (write the soul file first)")
    return path


def add_fact(path: Path, src: str, text: str, date: str | None = None) -> str:
    """Append one dated fact under ## Facts, making the section if the file has none."""
    line = f"- {date or dt.datetime.now().astimezone().date().isoformat()} · {src} · {' '.join(text.split())}"
    body = path.read_text().rstrip("\n")
    if FACTS not in body:
        body += f"\n\n{FACTS}\n\n{FACTS_HINT}"
    path.write_text(f"{body}\n{line}\n")
    return line


def facts(profile: Path, src: str | None = None) -> list[tuple[Path, str]]:
    """Every fact line in the profile's soul files and relationships.md, optionally from one source."""
    found = []
    for path in (profile / "relationships.md", *sorted((profile / "entities").glob("*.md"))):
        if not path.exists() or FACTS not in (text := path.read_text()):
            continue
        for line in text.split(FACTS, 1)[1].splitlines():
            if (m := FACT.match(line)) and src in (None, m[2]):
                found.append((path, line))
    return found


def remove_facts(profile: Path, src: str) -> list[tuple[Path, str]]:
    gone = facts(profile, src)
    for path in {p for p, _ in gone}:
        head, tail = path.read_text().split(FACTS, 1)
        kept = [ln for ln in tail.splitlines() if not ((m := FACT.match(ln)) and m[2] == src)]
        path.write_text(head + FACTS + "\n".join(kept) + "\n")
    return gone


def fact_command(args: list[str]) -> None:
    """fact, facts, unfact: the dated log of what episodes and chats add to a profile."""
    if len(args) < {"fact": 5, "facts": 2, "unfact": 3}[args[0]]:
        sys.exit(__doc__)
    profile = writable(args[1])
    if args[0] == "fact":
        print(add_fact(fact_file(profile, args[2]), args[3], " ".join(args[4:])))
        return
    listed = facts(profile, args[2] if len(args) > 2 else None) if args[0] == "facts" else remove_facts(profile, args[2])
    for path, line in listed:
        print(f"{'removed ' if args[0] == 'unfact' else ''}{path.relative_to(profile)}: {line}")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(f"profiles in {user_dir()}")
        for prof in available():
            print(f"  {prof.name}")
        return
    if args[0] == "new":
        dest = user_dir() / args[1]
        if dest.exists():
            sys.exit(f"already exists: {dest}")
        for sub in ("voices", "episodes", "renders", "entities"):
            (dest / sub).mkdir(parents=True)
        for f, body in TEMPLATE.items():
            (dest / f).write_text(body.format(name=args[1], facts=FACTS_HINT))
        print(dest)
        return
    if args[0] in ("fact", "facts", "unfact"):
        fact_command(args)
        return
    profile = find(args[0])
    if profile is None:
        sys.exit(f"no profile: {args[0]}\navailable: {', '.join(p.name for p in available())}")
    print(profile)
    for f in (*FILES, "structure.json", "levels.json"):
        print(f"  {f}{'' if (profile / f).exists() else '  (none)'}")
    print(f"  voices: {', '.join(sorted(w.stem for w in (profile / 'voices').glob('*.wav')))}")
    for e in episodes(profile):
        print(f"  episodes/{e.name}")


if __name__ == "__main__":
    main()
