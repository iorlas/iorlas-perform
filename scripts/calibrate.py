# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["numpy", "soundfile", "pyloudnorm", "librosa"]
# ///
"""Measure each voice's loudness and pitch from rendered clips; write levels.json.

Voices cloned from different references come out at different levels: one
character shouts quietly, another whispers loudly. This measures every clip
(scene.py --clips DIR writes NN_voice.wav) and gives each voice one fixed gain
that brings its median loudness to the target. scene.py applies it per voice,
not per line, so a whisper stays quieter than a shout.

    {
      "target_lufs": -20,
      "voices": {
        "vadik": {"lufs": -23.4, "gain_db": 3.4, "f0_hz": 148, "clips": 12,
                  "offset_db": 0, "semitones": 0}
      }
    }

- lufs: median integrated loudness of the voice's clips (ITU-R BS.1770).
- gain_db: target minus lufs, clamped to +-12 dB; re-measured on each run.
- f0_hz: median pitch over voiced frames; voices closer than 10% are reported,
  since the ear tells them apart by pitch first.
- offset_db and semitones are yours: kept across runs. offset_db adds to the
  gain (a narrator a little under the cast: -2); semitones shifts the pitch at
  render, timbre changes with it (+2 made one voice sound younger).

Usage: uv run calibrate.py CLIPS_DIR [CLIPS_DIR ...] --profile NAME|DIR [--target -20]
       uv run calibrate.py CLIPS_DIR --dry-run      print, write nothing
"""
import argparse
import json
import re
import sys
from datetime import datetime
from itertools import pairwise
from pathlib import Path

import numpy as np
import soundfile as sf

import profiles

CLIP = re.compile(r"^\d+_(.+)\.wav$")


def measure(wav: Path) -> tuple[float, float] | None:
    """(integrated LUFS, median f0 in Hz) for one clip; None when too short."""
    import librosa
    import pyloudnorm

    audio, sr = sf.read(wav, dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if len(audio) < 0.5 * sr:
        return None
    lufs = pyloudnorm.Meter(sr).integrated_loudness(audio)
    f0, voiced, _ = librosa.pyin(audio, fmin=60, fmax=500, sr=sr, frame_length=2048)
    f0 = f0[voiced & ~np.isnan(f0)]
    return lufs, float(np.median(f0)) if len(f0) else float("nan")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("clips", nargs="+", type=Path)
    p.add_argument("--profile", help="profile name or folder to write levels.json into")
    p.add_argument("--target", type=float, default=-20.0, help="target loudness per voice, LUFS")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    # scene.py --clips writes clips.json: the gain, pitch shift and phone filter each clip got.
    # Undo them here so a recalibration measures the raw voice, not the last calibration.
    per_voice: dict[str, list[tuple[float, float]]] = {}
    for folder in args.clips:
        applied = json.loads((folder / "clips.json").read_text()) if (folder / "clips.json").exists() else {}
        for wav in sorted(folder.glob("*.wav")):
            got = applied.get(wav.name, {})
            if got.get("phone") or not (m := CLIP.match(wav.name)) or not (r := measure(wav)) or not np.isfinite(r[0]):
                continue  # a phone-filtered clip says nothing about the voice's level
            lufs, f0 = r[0] - got.get("gain_db", 0), r[1] / 2 ** (got.get("semitones", 0) / 12)
            per_voice.setdefault(m[1], []).append((lufs, f0))
    if not per_voice:
        sys.exit("no NN_voice.wav clips found (render with scene.py --clips DIR)")

    dest = None
    old = {}
    if args.profile:
        prof = profiles.writable(args.profile)
        dest = prof / "levels.json"
        if dest.exists():
            old = json.loads(dest.read_text()).get("voices", {})

    voices = {}
    for v, rs in sorted(per_voice.items()):
        lufs = float(np.median([r[0] for r in rs]))
        f0s = [r[1] for r in rs if np.isfinite(r[1])]
        mine = old.get(v, {})
        voices[v] = {"lufs": round(lufs, 1),
                     "gain_db": round(float(np.clip(args.target - lufs, -12, 12)), 1),
                     "f0_hz": round(float(np.median(f0s))) if f0s else None,
                     "clips": len(rs),
                     "offset_db": mine.get("offset_db", 0),
                     "semitones": mine.get("semitones", 0)}
    for v, mine in old.items():  # voices with no clips this run keep their old entry
        voices.setdefault(v, mine)

    print(f"{'voice':12} {'clips':>5} {'LUFS':>6} {'gain':>6} {'f0 Hz':>6}")
    for v, x in voices.items():
        print(f"{v:12} {x.get('clips', 0):>5} {x['lufs']:>6} {x['gain_db']:>+6} {x['f0_hz'] or '-':>6}")
    pitched = sorted((x["f0_hz"], v) for v, x in voices.items() if x.get("f0_hz"))
    for (fa, a), (fb, b) in pairwise(pitched):
        if fb / fa < 1.10:
            print(f"close pitch: {a} {fa} Hz and {b} {fb} Hz; keep them apart in fast exchanges")

    if dest and not args.dry_run:
        dest.write_text(json.dumps({"target_lufs": args.target,
                                    "measured": str(datetime.now().astimezone().date()),
                                    "from": [str(c) for c in args.clips],
                                    "voices": voices}, ensure_ascii=False, indent=2) + "\n")
        print(dest)


if __name__ == "__main__":
    main()
