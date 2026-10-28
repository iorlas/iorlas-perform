"""Where voice references live.

A voice is <name>.wav + <name>.txt (exact transcript of the wav).
Lookup order: the scenario's profile voices (profiles.py), then your own
voices in $PERFORM_VOICES, else ./voices in the current directory, then the
bundled voices in the plugin's voices/ folder.
"""
import os
from pathlib import Path

BUNDLED = Path(__file__).resolve().parent.parent / "voices"


def user_dir() -> Path:
    return Path(os.environ.get("PERFORM_VOICES", "voices")).expanduser()


def find(name: str, first: list[Path] = ()) -> Path | None:
    for folder in (*first, user_dir(), BUNDLED):
        wav = folder / f"{name}.wav"
        if wav.exists() and wav.with_suffix(".txt").exists():
            return wav
    return None


def available(first: list[Path] = ()) -> list[str]:
    names = {w.stem for d in (*first, user_dir(), BUNDLED) for w in d.glob("*.wav")}
    return sorted(names)
