"""TTS engines and their models. Nothing is downloaded until an engine is first used.

Models go to the Hugging Face cache (~/.cache/huggingface, or $HF_HOME). The first
use of a model logs that it is downloading and how big it is, so a long wait is
never silent.
"""

import sys
import time
from collections.abc import Iterable
from typing import Any, Protocol, cast


class Result(Protocol):
    audio: Any  # an mlx array: np.array(r.audio) makes it numpy


class TTSModel(Protocol):
    """The slice of an mlx-audio model the scripts use; load_model itself returns an untyped Module."""

    sample_rate: int

    def generate(self, *, text: str, ref_audio: Any, ref_text: str, max_tokens: int) -> Iterable[Result]: ...

    def generate_voice_design(self, *, text: str, language: str, instruct: str) -> Iterable[Result]: ...


ENGINES = {
    # name: (Hugging Face repo, approx download size)
    "drama3": ("mlx-community/fish-audio-drama-3-3bit", "19.8 GB"),
    "s2": ("mlx-community/fish-audio-s2-pro", "10 GB"),
}
DEFAULT = "drama3"
VOICE_DESIGN = ("mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16", "4.5 GB")


def log(msg: str) -> None:
    print(f"[perform] {msg}", file=sys.stderr, flush=True)


def is_cached(repo: str) -> bool:
    # A full snapshot check fails: mlx-audio fetches only some of the repo's files.
    from huggingface_hub import try_to_load_from_cache

    return isinstance(try_to_load_from_cache(repo, "config.json"), str)


def load(repo: str, size: str) -> TTSModel:
    """Load a model, logging a first-use download explicitly."""
    from mlx_audio.tts.utils import load_model

    if is_cached(repo):
        log(f"loading {repo} (cached)")
    else:
        log(f"first use: downloading {repo}, about {size}, to the Hugging Face cache. This takes a while; later runs load from the cache.")
    t = time.time()
    model = cast("TTSModel", load_model(repo))  # pyrefly: ignore[bad-argument-type]  # annotated Path, takes a repo id
    log(f"ready in {time.time() - t:.0f}s")
    return model


def load_engine(name: str) -> TTSModel:
    return load(*ENGINES[name])


def ref_text(engine: str, transcript: str) -> str:
    """Drama 3 transcripts carry a speaker tag; one voice per call is speaker 0."""
    return f"<|speaker:0|> {transcript}" if engine == "drama3" else transcript
