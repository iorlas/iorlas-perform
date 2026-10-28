"""Profiles: one folder per series or world, everything a scenario needs.

    <profiles>/<name>/
      profile.md      what the series is: format, length, language, tone, intro, acting taste
      world.md        setting, entities, rules of the world, running gags, canon so far
      characters.md   cast table, character design, relationships, how each one sounds
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
"""

import os
import re
import sys
from pathlib import Path

PLUGIN = "iorlas-perform"
MARKETPLACE = "iorlas-marketplace"  # used when running from a checkout, not an install
FILES = ("profile.md", "world.md", "characters.md")
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

## Relationships

| pair | what goes on between them | the recurring move | who starts high | what flips it |
|---|---|---|---|---|
| | | | | |

## How each one sounds

- **Имя** (`hero`): voice, tics, fillers, catchphrase (rare).
""",
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
        for sub in ("voices", "episodes", "renders"):
            (dest / sub).mkdir(parents=True)
        for f, body in TEMPLATE.items():
            (dest / f).write_text(body.format(name=args[1]))
        print(dest)
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
