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
       uv run profiles.py copy NAME       copy a bundled profile into ./profiles
"""
import os
import shutil
import sys
from pathlib import Path

BUNDLED = Path(__file__).resolve().parent.parent / "profiles"
FILES = ("profile.md", "world.md", "characters.md")


def user_dir() -> Path:
    return Path(os.environ.get("PERFORM_PROFILES", "profiles")).expanduser()


def find(name: str) -> Path | None:
    for folder in (user_dir(), BUNDLED):
        if (folder / name / "profile.md").exists():
            return folder / name
    return None


def of(path: str | Path) -> Path | None:
    """The profile a scenario file belongs to: the nearest parent with profile.md."""
    for folder in Path(path).resolve().parents:
        if (folder / "profile.md").exists():
            return folder
    return None


def available() -> list[tuple[str, Path]]:
    seen = {}
    for folder in (user_dir(), BUNDLED):
        for p in sorted(folder.glob("*/profile.md")):
            seen.setdefault(p.parent.name, p.parent)
    return sorted(seen.items())


def episodes(profile: Path) -> list[Path]:
    return sorted((profile / "episodes").glob("*.md"))


def main():
    args = sys.argv[1:]
    if not args:
        for name, path in available():
            print(f"{name}\t{path}{'  (bundled, read-only)' if path.parent == BUNDLED else ''}")
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
