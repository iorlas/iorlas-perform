# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy", "soundfile"]
# ///
"""One-shot sound effects for scenes: a phone ringing, a modem, a door, a kettle.

Synthesized in numpy like the ambience beds: nothing downloads, nothing to
license. The messenger and call sounds are look-alikes in spirit, not copies of
any product's sample. A fixed seed makes renders repeatable.

scene.py places an effect between turns (`- {sfx phone_ring}`) and scales it
SFX_DB below the speech; `make()` returns it at unit loudness.

Preview: uv run sfx.py phone_ring [out.wav]    (no name: list them)
"""

import sys
from collections.abc import Callable, Sequence

import numpy as np
import soundfile as sf

from ambience import band, burst, events, loudness, shaped

SR = 24000
SFX_DB = 8  # effect level below the speech


def t_(dur: float, sr: int) -> np.ndarray:
    return np.arange(int(dur * sr)) / sr


def env(n: int, sr: int, attack: float = 0.005, release: float = 0.02) -> np.ndarray:
    """Flat envelope with short ramps, so tones don't click."""
    e = np.ones(n)
    a, r = min(n, int(attack * sr)), min(n, int(release * sr))
    e[:a] = np.linspace(0, 1, a)
    if r:
        e[n - r :] *= np.linspace(1, 0, r)
    return e


def sine(freqs: Sequence[float], dur: float, sr: int, attack: float = 0.005, release: float = 0.02) -> np.ndarray:
    t = t_(dur, sr)
    x = sum(np.sin(2 * np.pi * f * t) for f in freqs) / len(freqs)
    return x * env(len(t), sr, attack, release)


def bell(freq: float, dur: float, sr: int, decay: float) -> np.ndarray:
    """A struck bell: inharmonic partials, fast attack, exponential decay."""
    t = t_(dur, sr)
    x = sum(a * np.sin(2 * np.pi * freq * k * t) * np.exp(-t / (decay / k**0.5)) for k, a in ((1, 1), (2.76, 0.4), (5.4, 0.2), (8.9, 0.1)))
    return x * env(len(t), sr, 0.002, 0.01)


def seq(sr: int, *parts: float | np.ndarray) -> np.ndarray:
    """Concatenate pieces; a number is that many seconds of silence."""
    return np.concatenate([np.zeros(int(p * sr)) if isinstance(p, (int, float)) else p for p in parts])


def over(base: np.ndarray, x: np.ndarray, at: float, sr: int) -> np.ndarray:
    """`x` laid over `base` starting `at` seconds in; the result is as long as needed."""
    i = int(at * sr)
    out = np.zeros(max(len(base), i + len(x)))
    out[: len(base)] += base
    out[i : i + len(x)] += x
    return out


def line(x: np.ndarray, sr: int) -> np.ndarray:
    """Heard through a phone line."""
    return band(x, sr, 300, 3400)


def phone_ring(sr: int, rng: np.random.Generator) -> np.ndarray:
    """An electronic phone: two tones warbling 16 times a second, three rings."""
    t = t_(1.0, sr)
    warble = np.where(np.sin(2 * np.pi * 16 * t) > 0, 1000, 1300)
    ring = np.sin(2 * np.pi * np.cumsum(warble) / sr) * env(len(t), sr)
    ring = ring + 0.3 * np.sin(2 * np.pi * 3 * np.cumsum(warble) / sr) * env(len(t), sr)
    return seq(sr, ring, 0.7, ring, 0.7, ring)


def phone_vibrate(sr: int, rng: np.random.Generator) -> np.ndarray:
    """A phone buzzing on a table: a rattling 170 Hz motor, three pulses."""
    t = t_(0.45, sr)
    motor = np.sign(np.sin(2 * np.pi * 170 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    rattle = shaped(len(t), sr, rng, lo=800, hi=4000) * 0.3 * (np.sin(2 * np.pi * 170 * t) > 0.7)
    pulse = band(motor + rattle, sr, 100, 3000) * env(len(t), sr, 0.02, 0.05)
    return seq(sr, pulse, 0.3, pulse, 0.6, pulse, 0.3, pulse)


def modem(sr: int, rng: np.random.Generator) -> np.ndarray:
    """Dial-up: dial tone, number, ringback, answer tone, then the handshake screech and hiss."""
    keys = {
        "1": (697, 1209),
        "2": (697, 1336),
        "3": (697, 1477),
        "4": (770, 1209),
        "5": (770, 1336),
        "6": (770, 1477),
        "7": (852, 1209),
        "8": (852, 1336),
        "9": (852, 1477),
        "0": (941, 1336),
    }
    dial = [p for d in "2747152" for p in (sine(keys[d], 0.09, sr), 0.06)]
    fsk = np.cumsum(np.repeat(rng.choice([980, 1180], 60), int(0.0033 * sr * 5))) / sr
    bits = np.sin(2 * np.pi * fsk)
    bong = sine([1200, 2400], 0.35, sr, 0.01, 0.1)
    n = int(3.2 * sr)
    t = np.arange(n) / sr
    sweep = np.sin(2 * np.pi * np.cumsum(1800 + 600 * np.sin(2 * np.pi * 7 * t)) / sr)
    hiss = shaped(n, sr, rng, lo=500, hi=3300) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.5 * t) ** 2)
    noise = 0.5 * sweep * np.exp(-t / 1.2) + 0.6 * hiss
    noise *= env(n, sr, 0.01, 0.4)
    x = seq(
        sr,
        sine([425], 0.8, sr),
        0.2,
        *dial,
        0.4,
        sine([425], 0.9, sr),
        0.5,
        sine([2100], 1.2, sr) * (1 - 0.3 * (t_(1.2, sr) % 0.45 < 0.01)),
        0.1,
        bits * env(len(bits), sr),
        0.05,
        bong,
        0.05,
        bong,
        noise,
    )
    return line(x, sr)


def creak(sr: int, rng: np.random.Generator, dur: float) -> np.ndarray:
    """Hinge creak: stick-slip pulses at a wandering rate, through wood resonances."""
    n = int(dur * sr)
    rate = 40 + 50 * np.abs(np.cumsum(rng.standard_normal(n)) / np.sqrt(n) * 3)
    phase = np.cumsum(rate) / sr
    pulses = (np.diff(np.floor(phase), prepend=0) > 0).astype(float)
    x = sum(np.convolve(pulses, np.sin(2 * np.pi * f * t_(0.02, sr)) * np.exp(-t_(0.02, sr) / 0.004))[:n] for f in (600, 1300, 2200))
    return x * np.hanning(n) ** 0.5


def thud(sr: int, rng: np.random.Generator, freq: float = 110, decay: float = 0.12, dur: float = 0.5) -> np.ndarray:
    t = t_(dur, sr)
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t / decay)
    knock = shaped(len(t), sr, rng, lo=100, hi=1500) * np.exp(-t / 0.02)
    return body + 0.6 * knock


def click(sr: int, rng: np.random.Generator, dur: float = 0.03) -> np.ndarray:
    return burst(sr, rng, dur, 0.004, 1500, 7000)


def door_open(sr: int, rng: np.random.Generator) -> np.ndarray:
    return seq(sr, 0.3 * click(sr, rng), 0.08, 0.25 * creak(sr, rng, 1.3))


def door_close(sr: int, rng: np.random.Generator) -> np.ndarray:
    return seq(sr, 0.15 * creak(sr, rng, 0.5), over(thud(sr, rng), 0.4 * click(sr, rng), 0.05, sr))


def door_knock(sr: int, rng: np.random.Generator) -> np.ndarray:
    def k() -> np.ndarray:
        return thud(sr, rng, freq=rng.uniform(170, 210), decay=0.05, dur=0.18) * rng.uniform(0.8, 1)

    return seq(sr, k(), 0.1, k(), 0.1, k(), 0.45, k(), 0.1, k())


def keyboard(sr: int, rng: np.random.Generator) -> np.ndarray:
    n = int(2.5 * sr)
    gate = np.ones(n)
    gate[int(1.1 * sr) : int(1.4 * sr)] = 0  # a thinking pause
    keys = events(n, sr, rng, 11, lambda r: burst(sr, r, 0.015, 0.003, 1500, 6000) * r.uniform(0.3, 1), gate=gate)
    return keys + events(n, sr, rng, 0.8, lambda r: burst(sr, r, 0.03, 0.006, 300, 3000) * 1.5)  # space bar


def notify(sr: int, rng: np.random.Generator) -> np.ndarray:
    return seq(sr, bell(1320, 0.12, sr, 0.15), bell(1760, 0.6, sr, 0.25))


def uh_oh(sr: int, rng: np.random.Generator) -> np.ndarray:
    """A messenger alert in the spirit of ICQ: two sung notes falling, "uh" then "oh"."""

    def vowel(f0: float, dur: float, formants: Sequence[float]) -> np.ndarray:
        t = t_(dur, sr)
        vib = f0 * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
        x = sum(
            np.sin(2 * np.pi * k * np.cumsum(vib) / sr) * sum(np.exp(-(((k * f0 - f) / 120) ** 2)) for f in formants) for k in range(1, 30)
        )
        return x * env(len(t), sr, 0.02, 0.06)

    return seq(sr, vowel(440, 0.16, (700, 1200)), 0.04, vowel(330, 0.32, (500, 850)))


def call_join(sr: int, rng: np.random.Generator) -> np.ndarray:
    """Someone joins a call: a soft rising three-note chime."""
    return seq(sr, *[bell(f, 0.5 if i == 2 else 0.11, sr, 0.3) for i, f in enumerate((660, 880, 1100))])


def lighter(sr: int, rng: np.random.Generator) -> np.ndarray:
    """Flint wheel twice, the flame, a drag on a cigarette with crackle."""

    def flint() -> np.ndarray:
        return burst(sr, rng, 0.07, 0.02, 2000, 8000)

    m = int(0.6 * sr)
    flame = shaped(m, sr, rng, lo=80, hi=900, tilt=-1) * np.hanning(m) * 0.5
    n = int(1.6 * sr)
    breath = shaped(n, sr, rng, lo=500, hi=4000, tilt=-1) * np.hanning(n) * 0.15
    crackle = events(n, sr, rng, 40, lambda r: burst(sr, r, 0.004, 0.001, 2000, 9000) * r.uniform(0.1, 0.5))
    return seq(sr, flint(), 0.25, flint(), 0.02, flame, 0.3, breath + crackle * np.hanning(n))


def kettle(sr: int, rng: np.random.Generator) -> np.ndarray:
    """An electric kettle coming to the boil, then its switch clicks off."""
    n = 6 * sr
    rise = np.linspace(0, 1, n) ** 1.5
    rumble = shaped(n, sr, rng, lo=60, hi=600, tilt=-1) * (0.2 + 0.8 * rise)
    bubbles = events(
        n,
        sr,
        rng,
        60,
        lambda r: np.sin(2 * np.pi * r.uniform(300, 900) * t_(0.03, sr)) * np.exp(-t_(0.03, sr) / 0.008) * r.uniform(0.2, 1),
        gate=rise,
    )
    hiss = shaped(n, sr, rng, lo=2000, hi=8000) * rise**3 * 0.4
    return seq(sr, (rumble + 1.5 * bubbles + hiss) * env(n, sr, 0.5, 0.05), 0.05, 0.8 * click(sr, rng, 0.05))


def cash_register(sr: int, rng: np.random.Generator) -> np.ndarray:
    """Keys, the drawer sliding out with a clatter, the bell."""
    keys = seq(sr, *[p for _ in range(3) for p in (0.5 * click(sr, rng), 0.12)])
    m = int(0.35 * sr)
    drawer = shaped(m, sr, rng, lo=200, hi=3000, tilt=-1) * np.hanning(m) * 0.4 + events(
        m, sr, rng, 30, lambda r: burst(sr, r, 0.01, 0.003, 1000, 6000) * r.uniform(0.2, 0.8)
    )
    return seq(sr, keys, over(drawer, bell(2600, 1.2, sr, 0.4), 0.1, sr))


def error_beep(sr: int, rng: np.random.Generator) -> np.ndarray:
    def beep(f: float) -> np.ndarray:
        return np.sign(np.sin(2 * np.pi * f * t_(0.15, sr))) * env(int(0.15 * sr), sr) * 0.5

    return band(seq(sr, beep(440), 0.08, beep(330)), sr, 200, 4000)


EffectFn = Callable[[int, np.random.Generator], np.ndarray]
EFFECTS: dict[str, EffectFn] = {
    f.__name__: f
    for f in (
        phone_ring,
        phone_vibrate,
        modem,
        door_open,
        door_close,
        door_knock,
        keyboard,
        notify,
        uh_oh,
        call_join,
        lighter,
        kettle,
        cash_register,
        error_beep,
    )
}


def make(name: str, sr: int, seed: int = 0) -> np.ndarray:
    """The effect at unit loudness (RMS of its sounding part)."""
    x = EFFECTS[name](sr, np.random.default_rng([seed, len(name)]))
    return (x / (loudness(x, sr) + 1e-12)).astype(np.float32)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\n".join(f"{k:14} {(f.__doc__ or '').strip()}" for k, f in EFFECTS.items()))
        sys.exit()
    name = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else f"{name}.wav"
    x = make(name, SR)
    sf.write(out, 0.9 * x / np.abs(x).max(), SR)
    print(f"{out}: {len(x) / SR:.1f}s")
