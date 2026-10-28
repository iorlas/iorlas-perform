# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlx-audio>=0.6.2", "soundfile"]
# ///
"""Render a multi-voice scene: one line per speaker turn, each in its own voice.

Scene format, one turn per line:

    girl: [excited] Дедушка, смотри, что я нашла!
    starik: [sigh] Опять ты по чердаку лазила?
    {pause 1.5}
    praporshchik: [shouting] Так, что тут происходит?

`voice: text` renders the text in that voice (see voices.py), `{pause N}` adds
N seconds of silence, blank lines and `#` comments are skipped.

Spacing: `voice@0.1: text` sets the gap before that turn, in seconds, instead of
--gap. A negative gap overlaps the previous turn: `girl@-0.8: Что?!` starts
0.8 s before the previous turn ends, and the two are mixed. Each clip's silent
edges are trimmed first, so gaps are exact.

Ambience (ambience.py): `{ambience night}` puts a background bed under the scene
from the next turn on, crossfading from the previous bed; `{ambience rain 0.5}`
sets its volume (1 = default, low under speech), `{ambience off}` fades it out.
The bed ducks while anyone speaks. Beds: office, kitchen, evening, night, rain, wind.

Phone line: `vadik+phone: Алло?` renders that turn through a telephone band.

Writes the wav and <out>.timeline.json: start and end of every turn in seconds,
so screen changes can follow the audio, then one entry per ambience bed.

Usage: uv run scene.py scene.txt [out.wav] [--gap 0.35] [--speed 1.1]
                       [--engine drama3|s2] [--clips DIR]

Engines (engines.py): drama3 (default, Fish Drama 3 3-bit) or s2 (Fish S2 Pro).
Each model downloads on its first use, with a log line saying so.
"""
import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

import ambience
import engines
import voices

TURN = re.compile(r"^([\w-]+(?:\+phone)?)(?:@(-?[\d.]+))?\s*:\s*(.+)$")
PAUSE = re.compile(r"^\{pause\s+([\d.]+)\}$")
AMBIENCE = re.compile(r"^\{ambience\s+([\w-]+)(?:\s+([\d.]+))?\}$")
PHONE = "+phone"


def parse(text: str) -> list[tuple[str, str | float, float | None]]:
    """Turns as (voice, text, gap before or None); pauses as ("pause", seconds, None);
    bed changes as ("ambience", name, volume)."""
    turns = []
    for n, line in enumerate(text.splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if m := PAUSE.match(line):
            turns.append(("pause", float(m[1]), None))
        elif m := AMBIENCE.match(line):
            if m[1] != "off" and m[1] not in ambience.BEDS:
                sys.exit(f"line {n}: no ambience '{m[1]}', have: off, {', '.join(ambience.BEDS)}")
            turns.append(("ambience", m[1], float(m[2]) if m[2] else 1.0))
        elif m := TURN.match(line):
            turns.append((m[1], m[3], float(m[2]) if m[2] else None))
        else:
            sys.exit(f"line {n}: expected 'voice: text' or '{{pause N}}': {line}")
    return turns


def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("out", nargs="?")
    p.add_argument("--gap", type=float, default=0.35, help="silence between turns, seconds")
    p.add_argument("--speed", type=float, default=1.1, help="tempo, pitch kept (default: 1.1)")
    p.add_argument("--engine", choices=engines.ENGINES, default=engines.DEFAULT)
    p.add_argument("--clips", type=Path, help="also save each turn as <dir>/NN_voice.wav")
    args = p.parse_args()

    dest = Path(args.out) if args.out else Path(args.src).with_suffix(".wav")
    turns = parse(Path(args.src).read_text())
    needed = {v.removesuffix(PHONE) for v, _, _ in turns if v not in ("pause", "ambience")}
    missing = sorted(v for v in needed if voices.find(v) is None)
    if missing:
        sys.exit(f"no voice: {', '.join(missing)}\navailable: {', '.join(voices.available())}")

    from mlx_audio.utils import load_audio

    model = engines.load_engine(args.engine)
    sr = model.sample_rate
    refs = {}
    for v in needed:
        wav = voices.find(v)
        transcript = wav.with_suffix(".txt").read_text().strip()
        refs[v] = (load_audio(str(wav), sample_rate=sr), engines.ref_text(args.engine, transcript))
    if args.clips:
        args.clips.mkdir(parents=True, exist_ok=True)

    # Clips are placed on a timeline, not concatenated, so a negative gap can overlap.
    placed, timeline = [], []
    changes, pending = [], []  # ambience changes: placed (sample, name, volume), waiting for a turn
    # A scene that opens on a bed lets it fade in before the first word.
    lead = int(ambience.XFADE * sr) if turns and turns[0][0] == "ambience" else 0
    end = lead  # sample where the previous turn (or pause) ends
    spoken = [t for v, t, _ in turns if v not in ("pause", "ambience")]
    total_chars, done_chars, done_turns = sum(map(len, spoken)), 0, 0
    log(f"{len(spoken)} turns, {len(needed)} voices, {total_chars} chars; ETA after the first turn")
    start = time.time()
    for n, (voice, text, gap) in enumerate(turns, 1):
        if voice == "pause":
            end += int(text * sr)
            continue
        if voice == "ambience":
            pending.append((text, gap))
            continue
        voice, phone = voice.removesuffix(PHONE), voice.endswith(PHONE)
        ref_audio, ref_text = refs[voice]
        t0 = time.time()
        results = model.generate(text=text, ref_audio=ref_audio, ref_text=ref_text, max_tokens=2048)
        audio = np.concatenate([np.array(r.audio) for r in results])
        if args.speed != 1.0:
            audio = atempo(audio, sr, args.speed)
        if phone:
            audio = phone_line(audio, sr)
        audio = trim(audio, sr)
        if args.clips:
            sf.write(args.clips / f"{n:02d}_{voice}.wav", audio, sr)
        at = max(0, end + int((args.gap if gap is None else gap) * sr)) if placed else lead
        changes += [(at, name, vol) for name, vol in pending]
        pending = []
        placed.append((at, audio))
        end = max(end, at + len(audio))
        timeline.append({"turn": n, "voice": voice, "text": text,
                         "start": round(at / sr, 3), "end": round((at + len(audio)) / sr, 3)}
                        | ({"phone": True} if phone else {}))
        # ETA scales the time so far by the characters left: render time follows text length.
        done_turns, done_chars = done_turns + 1, done_chars + len(text)
        elapsed = time.time() - start
        eta = elapsed / done_chars * (total_chars - done_chars)
        log(f"{done_turns}/{len(spoken)} {done_chars * 100 // total_chars}% {voice}: "
            f"{len(audio) / sr:.1f}s audio in {time.time() - t0:.1f}s | "
            f"elapsed {clock(elapsed)}, ETA {clock(eta)} | {text[:40]}")

    mix = np.zeros(end, dtype=np.float32)
    for at, audio in placed:
        mix[at:at + len(audio)] += audio
    changes += [(end, name, vol) for name, vol in pending]
    if changes:
        bed, segments = ambience.render(changes, mix, sr)
        mix = np.pad(mix, (0, len(bed) - len(mix))) + bed
        timeline += segments
        for seg in segments:
            log(f"ambience: {seg['ambience']} {clock(seg['start'])}-{clock(seg['end'])}")
    peak = np.abs(mix).max()
    if peak > 0.99:  # overlaps can clip
        mix *= 0.99 / peak
    sf.write(dest, mix, sr)
    dest.with_suffix(".timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n")
    took, length = time.time() - start, len(mix) / sr
    log(f"done: {length:.1f}s audio in {clock(took)} ({length / took:.2f}x real time)")
    print(f"{dest}: {length:.1f}s audio in {took:.1f}s")


def log(msg: str):
    print(f"[perform] {msg}", flush=True)


def clock(secs: float) -> str:
    return f"{int(secs) // 60}m{int(secs) % 60:02d}s"


def trim(audio: np.ndarray, sr: int, keep: float = 0.03) -> np.ndarray:
    """Cut silent edges (below 2% of peak), keeping `keep` seconds of margin."""
    loud = np.where(np.abs(audio) > 0.02 * np.abs(audio).max())[0]
    if not len(loud):
        return audio
    margin = int(keep * sr)
    return audio[max(0, loud[0] - margin):loud[-1] + margin]


def atempo(audio: np.ndarray, sr: int, speed: float) -> np.ndarray:
    """Tempo change with pitch kept; per turn so the timeline stays exact."""
    return ffmpeg(audio, sr, f"atempo={speed}")


def phone_line(audio: np.ndarray, sr: int) -> np.ndarray:
    """A voice heard through a phone: 300-3400 Hz band, slightly overdriven."""
    audio = ffmpeg(audio, sr, "highpass=f=300,highpass=f=300,lowpass=f=3400,lowpass=f=3400")
    peak = np.abs(audio).max() or 1.0
    return np.tanh(2.5 * audio / peak) * peak / np.tanh(2.5)


def ffmpeg(audio: np.ndarray, sr: int, filters: str) -> np.ndarray:
    out = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
         "-filter:a", filters, "-f", "f32le", "-"],
        input=audio.astype(np.float32).tobytes(), capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.float32)


if __name__ == "__main__":
    main()
