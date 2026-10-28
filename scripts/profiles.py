"""Profiles: one folder per series or world, everything a scenario needs.

    profiles/<name>/
      profile.md     what the series is: format, tone, humour, writing preferences
      world.md       setting, places, rules of the world, running gags
      characters.md  cast table (voice | who), each character's tics, fillers, accent
      voices/        <voice>.wav + <voice>.txt for this cast
      episodes/      NN-slug.md scenarios, in order; the canon so far

Your own profiles: $PERFORM_PROFILES, else ./profiles. Bundled example
profiles ship in the plugin's profiles/ folder and are read-only: copy one to
./profiles before writing new episodes into it.

Usage: uv run profiles.py                 list profiles
       uv run profiles.py NAME            show a profile's files and episodes
       uv run profiles.py new NAME        create an empty profile in ./profiles
       uv run profiles.py copy NAME       copy a bundled profile into ./profiles
"""

import os
import shutil
import sys
from pathlib import Path

BUNDLED = Path(__file__).resolve().parent.parent / "profiles"
FILES = ("profile.md", "world.md", "characters.md")
INTRO = "00-intro.md"  # played before every episode by scene.py


TEMPLATE = {
    "profile.md": (
        "# {name}\n\nWhat the series is, in two lines.\n\n## Format\n\n- Episode length, intro or not, narration style.\n\n"
        "## Tone and humour\n\n- Audience, tone, what is in and out of bounds.\n\n## Acting\n\n- Delivery habits, laughs, accents.\n"
    ),
    "world.md": ("# World\n\n## Setting\n\n- Where and when.\n\n## Rules of the world\n\n-\n\n## Running gags\n\n-\n\n## Canon so far\n\n"),
    "characters.md": (
        "# Characters\n\n| voice | who |\n|---|---|\n| hero | Имя, кто это |\n\n"
        "## How each one sounds\n\n- **Имя** (`hero`): voice, tics, fillers.\n"
    ),
}


def user_dir() -> Path:
    return Path(os.environ.get("PERFORM_PROFILES", "profiles")).expanduser()


def find(name: str) -> Path | None:
    for folder in (user_dir(), BUNDLED):
        if (folder / name / "profile.md").exists():
            return folder / name
    return None


def writable(name: str) -> Path:
    """A profile to write into, by name or folder; exits on a missing or bundled one."""
    prof = find(name) or Path(name).expanduser()
    if not (prof / "profile.md").exists():
        sys.exit(f"no profile: {name} (create one: profiles.py new NAME)")
    # Bundled profiles are read-only only when installed: a plugin update replaces the cache.
    # In a checkout of the plugin repo they are ordinary files.
    if prof.resolve().parent == BUNDLED.resolve() and "/plugins/cache/" in str(BUNDLED):
        sys.exit(f"{name} is a bundled, read-only profile: run profiles.py copy {prof.name} first")
    return prof


def of(path: str | Path) -> Path | None:
    """The profile a scenario file belongs to: the nearest parent with profile.md."""
    for folder in Path(path).resolve().parents:
        if (folder / "profile.md").exists():
            return folder
    return None


def available() -> list[tuple[str, Path]]:
    seen: dict[str, Path] = {}
    for folder in (user_dir(), BUNDLED):
        for p in sorted(folder.glob("*/profile.md")):
            seen.setdefault(p.parent.name, p.parent)
    return sorted(seen.items())


def episodes(profile: Path) -> list[Path]:
    return sorted((profile / "episodes").glob("*.md"))


def main() -> None:
    args = sys.argv[1:]
    if not args:
        for name, path in available():
            print(f"{name}\t{path}{'  (bundled)' if path.parent == BUNDLED else ''}")
        return
    if args[0] == "new":
        dest = user_dir() / args[1]
        if dest.exists():
            sys.exit(f"already exists: {dest}")
        (dest / "voices").mkdir(parents=True)
        (dest / "episodes").mkdir()
        for f, body in TEMPLATE.items():
            (dest / f).write_text(body.format(name=args[1]))
        print(dest)
        return
    if args[0] == "copy":
        src = BUNDLED / args[1]
        dest = user_dir() / args[1]
        if not (src / "profile.md").exists():
            sys.exit(f"no bundled profile: {args[1]}")
        if dest.exists():
            sys.exit(f"already exists: {dest}")
        shutil.copytree(src, dest)
        print(dest)
        return
    profile = find(args[0])
    if profile is None:
        sys.exit(f"no profile: {args[0]}\navailable: {', '.join(n for n, _ in available())}")
    print(profile)
    for f in FILES:
        print(f"  {f}{'' if (profile / f).exists() else '  (missing)'}")
    print(f"  voices: {', '.join(sorted(w.stem for w in (profile / 'voices').glob('*.wav')))}")
    for e in episodes(profile):
        print(f"  episodes/{e.name}")


if __name__ == "__main__":
    main()
