# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlx-audio>=0.6.2", "soundfile"]
# ///
"""Render a multi-voice scene: one line per speaker turn, each in its own voice.

Scenario format (scenario.py), Markdown: a cast table, a heading per scene,
turns as list items:

    ## Cast
    | voice | who |
    |---|---|
    | girl | Маша, внучка |
    | starik | Дед Егор |

    ## Чердак, вечер
    > ambience night
    - narrator: [calm] Вечер. Чердак. Маша нашла коробку.
    - girl: [excited] Дедушка, смотри, что я нашла!
    - starik: [sigh] Опять ты по чердаку лазила?

`voice: text` renders the text in that voice (see voices.py), `{pause N}` adds
N seconds of silence, a scene heading adds --scene-pause before every scene but
the first. `.txt` files use the older one-turn-per-line format. The lint runs first: errors
stop the render before the model loads (--no-lint skips it).

Spacing: `voice@0.1: text` sets the gap before that turn, in seconds, instead of
--gap. A negative gap overlaps the previous turn: `girl@-0.8: Что?!` starts
0.8 s before the previous turn ends, and the two are mixed. Each clip's silent
edges are trimmed first, so gaps are exact.

Writes the wav and <out>.timeline.json: start and end of every turn in seconds,
so screen changes can follow the audio.

Silences inside a turn longer than --max-silence (0.6 s) are shortened to it.

Usage: uv run scene.py scene.md [out.wav] [--gap 0.35] [--speed 1.1]
                       [--max-silence 0.6] [--engine drama3|s2] [--clips DIR]

Engines (engines.py): drama3 (default, Fish Drama 3 3-bit) or s2 (Fish S2 Pro).
Each model downloads on its first use, with a log line saying so.
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

import engines
import profiles
import scenario
import voices
from scenario import Pause, Scene


def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("out", nargs="?")
    p.add_argument("--gap", type=float, default=0.35, help="silence between turns, seconds")
    p.add_argument("--speed", type=float, default=1.1, help="tempo, pitch kept (default: 1.1)")
    p.add_argument("--engine", choices=engines.ENGINES, default=engines.DEFAULT)
    p.add_argument("--max-silence", type=float, default=0.6,
                   help="shorten silences inside a turn to this, seconds (0: keep)")
    p.add_argument("--scene-pause", type=float, default=1.5, help="silence before each scene, seconds")
    p.add_argument("--no-lint", action="store_true", help="render even when the lint finds errors")
    p.add_argument("--clips", type=Path, help="also save each turn as <dir>/NN_voice.wav")
    args = p.parse_args()

    dest = Path(args.out) if args.out else Path(args.src).with_suffix(".wav")
    sc = scenario.load(args.src)
    if not scenario.report(scenario.lint(sc), args.src) and not args.no_lint:
        sys.exit("[perform] lint errors: fix them or pass --no-lint")
    needed = {t.voice for t in sc.turns}
    profile = profiles.of(args.src)
    first = [profile / "voices"] if profile else []
    if profile:
        log(f"profile: {profile.name} ({profile})")
    missing = sorted(v for v in needed if voices.find(v, first) is None)
    if missing:
        sys.exit(f"no voice: {', '.join(missing)}\navailable: {', '.join(voices.available(first))}")

    from mlx_audio.utils import load_audio

    model = engines.load_engine(args.engine)
    sr = model.sample_rate
    refs = {}
    for v in needed:
        wav = voices.find(v, first)
        transcript = wav.with_suffix(".txt").read_text().strip()
        refs[v] = (load_audio(str(wav), sample_rate=sr), engines.ref_text(args.engine, transcript))
    if args.clips:
        args.clips.mkdir(parents=True, exist_ok=True)

    # Clips are placed on a timeline, not concatenated, so a negative gap can overlap.
    placed, timeline = [], []
    end = 0  # sample where the previous turn (or pause) ends
    turns = sc.turns
    total_chars, done_chars, done_turns = sum(len(t.text) for t in turns), 0, 0
    log(f"{len(turns)} turns, {len(sc.scenes)} scenes, {len(needed)} voices, {total_chars} chars; "
        f"ETA after the first turn")
    start, scene = time.time(), None
    for n, item in enumerate(sc.items, 1):
        if isinstance(item, Pause):
            end += int(item.secs * sr)
            continue
        if isinstance(item, Scene):
            if placed:
                end += int(args.scene_pause * sr)
            scene = item
            log(f"scene: {item.title}" + (f" | ambience {item.ambience}" if item.ambience else ""))
            continue
        voice, text, gap = item.voice, item.text, item.gap
        ref_audio, ref_text = refs[voice]
        t0 = time.time()
        results = model.generate(text=text, ref_audio=ref_audio, ref_text=ref_text, max_tokens=2048)
        audio = np.concatenate([np.array(r.audio) for r in results])
        if args.speed != 1.0:
            audio = atempo(audio, sr, args.speed)
        audio = trim(audio, sr)
        if args.max_silence:
            audio = squash(audio, sr, args.max_silence)
        if args.clips:
            sf.write(args.clips / f"{n:02d}_{voice}.wav", audio, sr)
        at = max(0, end + int((args.gap if gap is None else gap) * sr)) if placed else 0
        placed.append((at, audio))
        end = max(end, at + len(audio))
        timeline.append({"turn": n, "voice": voice, "text": text,
                         "scene": scene.title if scene else None,
                         "ambience": scene.ambience if scene else None,
                         "start": round(at / sr, 3), "end": round((at + len(audio)) / sr, 3)})
        # ETA scales the time so far by the characters left: render time follows text length.
        done_turns, done_chars = done_turns + 1, done_chars + len(text)
        elapsed = time.time() - start
        eta = elapsed / done_chars * (total_chars - done_chars)
        log(f"{done_turns}/{len(turns)} {done_chars * 100 // total_chars}% {voice}: "
            f"{len(audio) / sr:.1f}s audio in {time.time() - t0:.1f}s | "
            f"elapsed {clock(elapsed)}, ETA {clock(eta)} | {text[:40]}")

    mix = np.zeros(end, dtype=np.float32)
    for at, audio in placed:
        mix[at:at + len(audio)] += audio
    peak = np.abs(mix).max()
    if peak > 0.99:  # overlaps can clip
        mix *= 0.99 / peak
    sf.write(dest, mix, sr)
    dest.with_suffix(".timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n")
    took = time.time() - start
    log(f"done: {end / sr:.1f}s audio in {clock(took)} ({end / sr / took:.2f}x real time)")
    print(f"{dest}: {end / sr:.1f}s audio in {took:.1f}s")


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


def squash(audio: np.ndarray, sr: int, longest: float, step: float = 0.01) -> np.ndarray:
    """Shorten silent runs inside a clip (below 2% of peak) to `longest` seconds.

    The model sometimes stops for 2-4 s at a dash or a [short pause] tag; on a
    timeline that reads as dead air, not as acting.
    """
    hop = int(step * sr)
    frames = len(audio) // hop
    quiet = np.abs(audio[:frames * hop]).reshape(frames, hop).max(axis=1) < 0.02 * np.abs(audio).max()
    keep, run, out = int(longest / step), 0, []
    for i, q in enumerate(quiet):
        run = run + 1 if q else 0
        if run <= keep:
            out.append(audio[i * hop:(i + 1) * hop])
    out.append(audio[frames * hop:])
    return np.concatenate(out)


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
