"""What a rendered line actually says: transcribe it and compare with the script.

The TTS model sometimes misses its stop and reads a line, or its tail, twice; sometimes it
skips words. Neither shows in the waveform's level, only in the words, so each take is
transcribed (Whisper, local, MLX) and checked against the text it was asked to say.
"""

import re
from difflib import SequenceMatcher

import numpy as np

ASR_MODEL = "mlx-community/whisper-large-v3-turbo"
ASR_RATE = 16000
MIN_MATCH = 0.5  # word overlap below this: words skipped or invented (ASR misspells names, so loose)
OVERRUN = 1.3  # heard this many times the script's words: a repeat or a ramble
REPEAT_RUN = 4  # a run of this many words heard twice, but written once, is a repeat


def words(text: str) -> list[str]:
    """Spoken words only: no [tags], no punctuation, ё as е, lower case."""
    text = re.sub(r"\[[^\]]*\]", " ", text).lower().replace("ё", "е")
    return re.sub(r"[^\w]+", " ", text).split()


def transcribe(audio: np.ndarray, sr: int, language: str = "ru") -> str:
    import mlx_whisper
    from scipy.signal import resample_poly

    x = resample_poly(audio.astype(np.float32), ASR_RATE, sr) if sr != ASR_RATE else audio.astype(np.float32)
    return mlx_whisper.transcribe(x, path_or_hf_repo=ASR_MODEL, language=language)["text"].strip()


def runs(w: list[str]) -> list[str]:
    return [" ".join(w[i : i + REPEAT_RUN]) for i in range(len(w) - REPEAT_RUN + 1)]


def problem(text: str, heard: str) -> tuple[str | None, float]:
    """(what is wrong or None, word match 0..1) for a take that was meant to say `text`."""
    said, got = words(text), words(heard)
    match = SequenceMatcher(None, said, got).ratio() if said else 1.0
    written = runs(said)
    heard_runs = runs(got)
    twice = [r for r in set(heard_runs) if heard_runs.count(r) > max(1, written.count(r))]
    if twice:
        return f"repeats «{twice[0]}»", match
    if len(got) > OVERRUN * len(said) + 2:
        return f"says {len(got)} words for {len(said)}", match
    # Whisper writes numbers as digits and some names in Latin («2010», «WhatsApp»): no fair
    # word match then, and a short line has too few words to judge.
    comparable = len(said) >= 5 and not re.search(r"[0-9a-z]", " ".join(got))
    if comparable and match < MIN_MATCH:
        return f"matches the text {match:.0%}", match
    return None, match
