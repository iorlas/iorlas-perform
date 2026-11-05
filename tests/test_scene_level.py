"""level_hushed: whispered and hushed turns lifted to a speech level, others untouched.

scene.py imports the TTS engine at module level; the heavy modules are stubbed so the test runs
without mlx: `uv run --with pytest --with numpy --with soundfile pytest tests`.
"""

import sys
import types
from pathlib import Path
from unittest import mock

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
STUBS = ("mlx", "mlx.core", "engines", "heard", "master", "profiles", "sfx", "voices", "ambience")
saved = {n: sys.modules.get(n) for n in STUBS}
for name in STUBS:
    sys.modules[name] = mock.MagicMock(spec=types.ModuleType(name))
sys.modules["mlx"].core = sys.modules["mlx.core"]

import scene  # noqa: E402
from scenario import Turn  # noqa: E402

for name, mod in saved.items():  # leave no stub behind for the other test files
    if mod is None:
        sys.modules.pop(name, None)
    else:
        sys.modules[name] = mod

SR = 16000


def tone(db: float, secs: float = 1.0) -> np.ndarray:
    """A sine whose RMS is `db` dBFS."""
    t = np.arange(int(SR * secs)) / SR
    return (np.sqrt(2) * 10 ** (db / 20) * np.sin(2 * np.pi * 220 * t)).astype("float32")


def rms_db(audio: np.ndarray) -> float:
    return 20 * np.log10(np.sqrt((audio**2).mean()))


def turn(text: str) -> Turn:
    return Turn(voice="a", text=text, gap=None, line=1, scene=0)


def test_whisper_raised_to_target():
    out = scene.level_hushed(tone(-35), SR, turn("[whispering] ну тихо"))
    assert abs(rms_db(out) - scene.WHISPER_RMS_DB) < 0.5


def test_hush_raised_to_its_own_target():
    out = scene.level_hushed(tone(-35), SR, turn("[quiet] ну тихо"))
    assert abs(rms_db(out) - scene.HUSH_RMS_DB) < 0.5


def test_plain_turn_unchanged():
    audio = tone(-35)
    assert scene.level_hushed(audio, SR, turn("ну тихо")) is audio


def test_never_attenuates_a_louder_whisper():
    audio = tone(-10)
    assert np.allclose(scene.level_hushed(audio, SR, turn("[whisper] x")), audio)


def test_gain_capped_at_turn_peak():
    audio = tone(-40)
    audio[100] = 0.2  # a click: raising to -19 dB RMS would clip it
    out = scene.level_hushed(audio, SR, turn("[whisper] x"))
    assert np.abs(out).max() <= scene.TURN_PEAK + 1e-6


def test_pauses_do_not_drag_the_level():
    speech = tone(-35, 0.5)
    audio = np.concatenate([speech, np.zeros(SR, "float32"), speech])
    out = scene.level_hushed(audio, SR, turn("[whisper] x"))
    assert abs(rms_db(out[: len(speech)]) - scene.WHISPER_RMS_DB) < 0.5
