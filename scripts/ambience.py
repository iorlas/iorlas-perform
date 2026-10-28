# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy", "soundfile"]
# ///
"""Background beds under a scene: office, kitchen, evening, night, rain, wind.

Every bed is synthesized in numpy at the exact length it plays, so there is no
loop seam and nothing to download. Noise is shaped in the frequency domain;
crowd chatter and the TV next door are the bundled voice references, layered and
muffled until no word is clear. A fixed seed makes renders repeatable.

scene.py calls `render()`: the beds crossfade at each change, sit BED_DB below
the speech and duck a further DUCK_DB while anyone talks.

Preview a bed: uv run ambience.py office [seconds] [out.wav]
"""
import sys

import numpy as np
import soundfile as sf

import voices

SR = 24000
XFADE = 1.5  # seconds, crossfade between beds
TAIL = 1.0  # seconds the last bed rings on after the last word
BED_DB = 21  # bed level below the speech
DUCK_DB = 9  # extra drop while someone speaks
ATTACK, RELEASE = 0.05, 0.45  # ducking speed, seconds
HOLD = 25  # 10 ms frames the duck holds after speech stops


def shaped(n, sr, rng, lo=None, hi=None, tilt=0.0):
    """Noise with unit RMS. tilt: 0 white, -1 pink, -2 brown; lo/hi: soft band edges in Hz."""
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / sr)
    f[0] = f[1]
    gain = f ** (tilt / 2)
    if lo:
        gain /= np.sqrt(1 + (lo / f) ** 4)
    if hi:
        gain /= np.sqrt(1 + (f / hi) ** 4)
    x = np.fft.irfft(spec * gain, n)
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-12)


def drift(n, sr, rng, rate, lo, hi):
    """Slow random level between lo and hi, changing about `rate` times a second."""
    x = shaped(n, sr, rng, hi=rate)
    return lo + (hi - lo) * np.clip(0.5 + 0.25 * x, 0, 1)


def events(n, sr, rng, per_sec, make, gate=None):
    """Sum of short sounds from make(rng) at random times; gate (0..1 per sample) thins them."""
    out = np.zeros(n)
    for t in rng.integers(0, n, rng.poisson(per_sec * n / sr)):
        if gate is not None and rng.random() > gate[t]:
            continue
        s = make(rng)[: n - t]
        out[t:t + len(s)] += s
    return out


def tone(sr, freq, dur, decay):
    t = np.arange(int(dur * sr)) / sr
    return np.sin(2 * np.pi * freq * t) * np.exp(-t / decay)


def burst(sr, rng, dur, decay, lo, hi):
    """A click: short noise burst, band-passed, decaying."""
    n = int(dur * sr)
    return shaped(n, sr, rng, lo=lo, hi=hi) * np.exp(-np.arange(n) / (decay * sr))


def talk(n, sr, rng, people, lo, hi):
    """Several bundled voices at random offsets, band-limited: chatter with no clear words."""
    refs = []
    for name in voices.available():
        wav = voices.find(name)
        if wav is None:
            continue
        a, rate = sf.read(wav, dtype="float32", always_2d=True)
        a = a.mean(axis=1)
        a = np.interp(np.arange(0, len(a), rate / sr), np.arange(len(a)), a)
        refs.append(a / (np.sqrt(np.mean(a ** 2)) + 1e-12))
    if not refs:
        return shaped(n, sr, rng, lo=lo, hi=hi, tilt=-1) * drift(n, sr, rng, 4, 0, 1)
    out = np.zeros(n)
    for _ in range(people):
        voice = np.concatenate([refs[i] for i in rng.permutation(len(refs))] * (n // sum(map(len, refs)) + 2))
        start = rng.integers(0, len(voice) - n)
        out += voice[start:start + n] * drift(n, sr, rng, 0.2, 0.3, 1.0)
    return band(out, sr, lo, hi)


def band(x, sr, lo=None, hi=None):
    f = np.fft.rfftfreq(len(x), 1 / sr)
    f[0] = f[1]
    gain = np.ones_like(f)
    if lo:
        gain /= np.sqrt(1 + (lo / f) ** 4)
    if hi:
        gain /= np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(np.fft.rfft(x) * gain, len(x))


def hum(n, sr, base, harmonics):
    t = np.arange(n) / sr
    return sum(a * np.sin(2 * np.pi * base * (k + 1) * t) for k, a in enumerate(harmonics))


def echo(x, sr, taps=((0.06, 0.35), (0.13, 0.2), (0.21, 0.1))):
    """Hard walls close by: a few early reflections, for a courtyard."""
    out = x.copy()
    for delay, gain in taps:
        d = int(delay * sr)
        out[d:] += gain * x[:-d]
    return out


def crickets(n, sr, rng, count, rate):
    """`count` crickets, each chirping about `rate` times a second in 3-4 pulses near 4.5 kHz."""
    out = np.zeros(n)
    t = np.arange(n) / sr
    for _ in range(count):
        env = np.zeros(n)
        pulse = np.hanning(int(0.012 * sr))
        period = 1 / rate * rng.uniform(0.8, 1.2)
        for start in np.arange(rng.uniform(0, period), n / sr, period):
            for k in range(rng.integers(3, 5)):
                i = int((start + k * 0.03 + rng.uniform(0, 0.004)) * sr)
                if i < n:
                    env[i:i + len(pulse)] += pulse[: n - i]
        out += np.sin(2 * np.pi * rng.uniform(4200, 5000) * t) * env * rng.uniform(0.3, 1)
    return out


def cars(n, sr, rng, per_min):
    """Distant traffic: a low rumble with cars swelling past."""
    def car(rng):
        d = rng.uniform(4, 9)
        m = int(d * sr)
        return shaped(m, sr, rng, lo=60, hi=rng.uniform(500, 900), tilt=-1) * np.hanning(m) ** 2
    return 0.5 * shaped(n, sr, rng, hi=200, tilt=-2) + events(n, sr, rng, per_min / 60, car)


def office(n, sr, rng):
    air = shaped(n, sr, rng, lo=40, hi=500, tilt=-1) + 0.15 * hum(n, sr, 50, [0, 1, 0.4, 0.2])
    chatter = talk(n, sr, rng, people=5, lo=200, hi=2200)
    typing = drift(n, sr, rng, 0.15, -0.6, 1)
    keys = events(n, sr, rng, 7, lambda r: burst(sr, r, 0.015, 0.003, 1500, 6000) * r.uniform(0.3, 1),
                  gate=typing)
    return 0.6 * air + 0.5 * chatter + 1.6 * keys


def kitchen(n, sr, rng):
    fridge = hum(n, sr, 50, [0.3, 1, 0.5, 0.3, 0.15]) * drift(n, sr, rng, 0.05, 0.85, 1)
    fridge += 0.4 * shaped(n, sr, rng, lo=30, hi=250, tilt=-1)
    tv = talk(n, sr, rng, people=1, lo=150, hi=700)  # through a wall
    return fridge + 0.6 * tv


def evening(n, sr, rng):
    return 1.2 * cars(n, sr, rng, per_min=10) + 0.25 * crickets(n, sr, rng, 2, 0.8) \
        + 0.3 * shaped(n, sr, rng, lo=80, hi=600, tilt=-1) * drift(n, sr, rng, 0.2, 0.3, 1)


def night(n, sr, rng):
    return 0.8 * crickets(n, sr, rng, 4, 1.2) + 0.5 * cars(n, sr, rng, per_min=3) \
        + 0.3 * shaped(n, sr, rng, lo=100, hi=800, tilt=-1) * drift(n, sr, rng, 0.15, 0.2, 1)


def rain(n, sr, rng):
    hiss = shaped(n, sr, rng, lo=700, hi=8000, tilt=-1) * drift(n, sr, rng, 0.1, 0.8, 1)
    drops = events(n, sr, rng, 120, lambda r: burst(sr, r, 0.01, 0.002, 2000, 9000) * r.uniform(0.1, 1))
    gutter = events(n, sr, rng, 2.5, lambda r: tone(sr, r.uniform(900, 2200), 0.12, 0.025) * r.uniform(0.4, 1))
    rumble = shaped(n, sr, rng, lo=40, hi=300, tilt=-1)
    return echo(hiss + 1.5 * drops + 2 * gutter, sr) + 0.4 * rumble


def wind(n, sr, rng):
    gusts = drift(n, sr, rng, 0.2, 0.15, 1.3)
    body = shaped(n, sr, rng, lo=80, hi=1200, tilt=-1)
    whistle = shaped(n, sr, rng, lo=650, hi=800)
    return gusts * (body + 0.25 * whistle * gusts)


BEDS = {"office": office, "kitchen": kitchen, "evening": evening, "night": night,
        "rain": rain, "wind": wind}


def bed(name: str, n: int, sr: int, seed: int = 0) -> np.ndarray:
    """`n` samples of the named bed at unit RMS."""
    x = BEDS[name](n, sr, np.random.default_rng([seed, n]))
    return (x / (np.sqrt(np.mean(x ** 2)) + 1e-12)).astype(np.float32)


def frame_rms(x: np.ndarray, sr: int) -> np.ndarray:
    """RMS per 10 ms frame."""
    hop = sr // 100
    frames = len(x) // hop + 1
    return np.sqrt(np.mean(np.pad(x, (0, frames * hop - len(x))).reshape(frames, hop) ** 2, axis=1))


def loudness(x: np.ndarray, sr: int) -> float:
    """RMS over the frames that sound (above 10% of the loudest): silences don't count."""
    rms = frame_rms(x, sr)
    loud = rms[rms > 0.1 * rms.max()] if rms.max() > 0 else rms
    return float(np.sqrt(np.mean(loud ** 2))) if len(loud) else 0.0


def ducking(speech: np.ndarray, sr: int) -> tuple[np.ndarray, float]:
    """Per-sample gain (1 in silence, -DUCK_DB while talking) and the speech RMS."""
    hop = sr // 100
    rms = frame_rms(speech, sr)
    frames = len(rms)
    level = loudness(speech, sr)
    target = np.clip(rms / (0.3 * level + 1e-12), 0, 1)
    # Hold: stay down through the short gaps between words.
    target = np.lib.stride_tricks.sliding_window_view(np.pad(target, (HOLD - 1, 0)), HOLD).max(axis=1)
    up, down = 1 - np.exp(-0.01 / ATTACK), 1 - np.exp(-0.01 / RELEASE)
    env, d = np.empty(frames), 0.0
    for i, x in enumerate(target):
        d += (x - d) * (up if x > d else down)
        env[i] = d
    gain = 10 ** (-DUCK_DB * env / 20)
    return np.interp(np.arange(len(speech)), np.arange(frames) * hop, gain), level


def render(changes, speech: np.ndarray, sr: int):
    """Beds under `speech` for changes [(sample, name, volume)], name "off" ends a bed.

    Each change crossfades over XFADE seconds, ending where the change is placed,
    so the new bed is up when the turn starts. Returns the bed (longer than speech
    by TAIL when a bed is still on at the end) and segments for the timeline.
    """
    on = changes[-1][1] != "off"
    total = len(speech) + (int(TAIL * sr) if on else 0)
    xf = int(XFADE * sr)
    duck, level = ducking(np.pad(speech, (0, total - len(speech))), sr)
    out, segments = np.zeros(total, dtype=np.float32), []
    starts = [max(0, at - xf) for at, _, _ in changes]
    for i, (at, name, vol) in enumerate(changes):
        if name == "off":
            continue
        a = starts[i]
        b = min(total, starts[i + 1] + xf) if i + 1 < len(changes) else total
        if b <= a:
            continue
        n = b - a
        x = bed(name, n, sr, seed=i) * (level * 10 ** (-BED_DB / 20) * vol)
        fade = min(xf, n)
        x[:fade] *= np.sin(np.linspace(0, np.pi / 2, fade))
        last = min(int(TAIL * sr) if i + 1 == len(changes) else xf, n)
        x[n - last:] *= np.cos(np.linspace(0, np.pi / 2, last))
        out[a:b] += x * duck[a:b]
        segments.append({"ambience": name, "volume": vol,
                         "start": round(a / sr, 3), "end": round(b / sr, 3)})
    return out, segments


if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "office"
    seconds = float(sys.argv[2]) if len(sys.argv) > 2 else 10
    out = sys.argv[3] if len(sys.argv) > 3 else f"{name}.wav"
    x = bed(name, int(seconds * SR), SR)
    sf.write(out, 0.9 * x / np.abs(x).max(), SR)
    print(out)
