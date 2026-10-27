"""Where voice references live.

A voice is <name>.wav + <name>.txt (exact transcript of the wav).
Your own voices: $PERFORM_VOICES, else ./voices in the current directory.
Bundled voices ship in the plugin's voices/ folder and are the fallback.
"""
import os
from pathlib import Path

BUNDLED = Path(__file__).resolve().parent.parent / "voices"


def user_dir() -> Path:
    return Path(os.environ.get("PERFORM_VOICES", "voices")).expanduser()


def find(name: str) -> Path | None:
    for folder in (user_dir(), BUNDLED):
        wav = folder / f"{name}.wav"
        if wav.exists() and wav.with_suffix(".txt").exists():
            return wav
    return None


def available() -> list[str]:
    names = {w.stem for d in (user_dir(), BUNDLED) for w in d.glob("*.wav")}
    return sorted(names)
