"""Final loudness step: bring a finished mix to a delivery loudness with a true-peak ceiling.

Apple's podcast spec, the default: -16 LUFS integrated (ITU-R BS.1770), true peak at or
below -1 dBTP (podcasters.apple.com/support/audio-requirements). Speech peaks sit well
above its average, so plain gain to -16 clips: a raised mix runs 4-7 dB over the ceiling.
A brickwall limiter takes those peaks down first, then the gain is set again, until both
numbers hold. True peak is measured 4x oversampled, as BS.1770 asks.
"""

import numpy as np
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import resample_poly

DEFAULT_LUFS = -16.0
CEILING_DB = -1.0
LIMIT_MS = 15  # gain change window: short enough to catch a plosive, long enough not to buzz


def lufs(x: np.ndarray, sr: int) -> float:
    import pyloudnorm

    return float(pyloudnorm.Meter(sr).integrated_loudness(x))


def true_peak_db(x: np.ndarray) -> float:
    peak = float(np.abs(resample_poly(x, 4, 1)).max())
    return 20 * np.log10(peak) if peak > 0 else -np.inf


def limit(x: np.ndarray, sr: int, ceiling: float) -> np.ndarray:
    """Brickwall limiter without a loop: the gain each sample needs, held over 2 windows, then averaged over 1.

    The held minimum spans every sample the average reads, so the smoothed gain never
    exceeds what any sample under it needs; the average makes the change gradual.
    """
    n = max(1, int(sr * LIMIT_MS / 1000))
    need = np.minimum(1.0, ceiling / np.maximum(np.abs(x), 1e-9))
    gain = uniform_filter1d(minimum_filter1d(need, 2 * n + 1), n)
    return (x * gain).astype(np.float32)


def normalize(
    x: np.ndarray, sr: int, target: float = DEFAULT_LUFS, ceiling_db: float = CEILING_DB
) -> tuple[np.ndarray, float, float, float]:
    """(mix at `target` LUFS with true peak <= `ceiling_db`, LUFS before, LUFS after, true peak after)."""
    before = lufs(x, sr)
    if not np.isfinite(before):
        return x, before, before, true_peak_db(x)  # silence: nothing to measure
    # Sample peaks under a margin keep the inter-sample peaks under the ceiling.
    ceiling = 10 ** ((ceiling_db - 0.5) / 20)
    y = x
    for _ in range(4):  # limiting lowers the loudness a little; raise and limit again
        y = limit(y * 10 ** ((target - lufs(y, sr)) / 20), sr, ceiling)
        if abs(lufs(y, sr) - target) < 0.2:
            break
    tp = true_peak_db(y)
    if tp > ceiling_db:  # an inter-sample peak got past the margin
        y *= 10 ** ((ceiling_db - tp) / 20)
        tp = ceiling_db
    return y, before, lufs(y, sr), tp
