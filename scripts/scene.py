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

Writes the wav and <out>.timeline.json: start and end of every turn in seconds,
so screen changes can follow the audio.

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

import engines
import voices

TURN = re.compile(r"^([\w-]+)\s*:\s*(.+)$")
PAUSE = re.compile(r"^\{pause\s+([\d.]+)\}$")


def parse(text: str) -> list[tuple[str, str | float]]:
    turns = []
    for n, line in enumerate(text.splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if m := PAUSE.match(line):
            turns.append(("pause", float(m[1])))
        elif m := TURN.match(line):
            turns.append((m[1], m[2]))
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
    needed = {v for v, _ in turns if v != "pause"}
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

    gap = np.zeros(int(args.gap * sr), dtype=np.float32)
    pieces, timeline, cursor = [], [], 0
    start = time.time()
    for n, (voice, text) in enumerate(turns, 1):
        if voice == "pause":
            pieces.append(np.zeros(int(text * sr), dtype=np.float32))
            cursor += len(pieces[-1])
            continue
        ref_audio, ref_text = refs[voice]
        results = model.generate(text=text, ref_audio=ref_audio, ref_text=ref_text, max_tokens=2048)
        audio = np.concatenate([np.array(r.audio) for r in results])
        if args.speed != 1.0:
            audio = atempo(audio, sr, args.speed)
        if args.clips:
            sf.write(args.clips / f"{n:02d}_{voice}.wav", audio, sr)
        timeline.append({"turn": n, "voice": voice, "text": text,
                         "start": round(cursor / sr, 3), "end": round((cursor + len(audio)) / sr, 3)})
        pieces += [audio, gap]
        cursor += len(audio) + len(gap)
        print(f"[{n}/{len(turns)}] {voice}: {len(audio) / sr:.1f}s  {text[:50]}", flush=True)

    sf.write(dest, np.concatenate(pieces), sr)
    dest.with_suffix(".timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n")
    print(f"{dest}: {cursor / sr:.1f}s audio in {time.time() - start:.1f}s")


def atempo(audio: np.ndarray, sr: int, speed: float) -> np.ndarray:
    """Tempo change with pitch kept, via ffmpeg; per turn so the timeline stays exact."""
    out = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
         "-filter:a", f"atempo={speed}", "-f", "f32le", "-"],
        input=audio.astype(np.float32).tobytes(), capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.float32)


if __name__ == "__main__":
    main()
