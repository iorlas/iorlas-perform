# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlx-audio>=0.6.2", "soundfile"]
# ///
"""Speak tagged text in a cloned voice with Fish S2 Pro, ElevenLabs-style.

Tags go to the model as written, so any free-form tag works:

    Привет! [bursts out laughing] Ну ты даёшь! [laughs uncontrollably] [sigh] Ладно...

Laughs: write [bursts out laughing] ... [laughs uncontrollably] around the line.
Never spell "ха-ха": the model reads it aloud as a word.
Other tags: [chuckle] [sigh] [inhale] [exhale] [whisper] [shouting] [excited]
[sad] [angry] [surprised] [pause] [short pause] [emphasis].

The voice is cloned from one reference, <voice>.wav + <voice>.txt, found in
$PERFORM_VOICES or ./voices, then in the bundled voices (see voices.py).

Usage:
    uv run speak.py script.txt                       # -> script.wav
    uv run speak.py script.txt out.wav --voice girl --speed 1.2
    echo "[sigh] Ладно." | uv run speak.py - out.wav
"""
import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

import voices

MODEL = "mlx-community/fish-audio-s2-pro"
PAUSE = 0.4  # seconds of silence between paragraphs


def main():
    p = argparse.ArgumentParser()
    p.add_argument("src", help="text file, or - for stdin")
    p.add_argument("out", nargs="?", help="output wav (default: next to src)")
    p.add_argument("--voice", default="praporshchik", help="voice name (default: praporshchik)")
    p.add_argument("--speed", type=float, default=1.1, help="tempo, pitch kept (default: 1.1)")
    args = p.parse_args()

    if args.src == "-" and not args.out:
        sys.exit("give an output path when reading stdin")
    text = sys.stdin.read() if args.src == "-" else Path(args.src).read_text()
    dest = Path(args.out) if args.out else Path(args.src).with_suffix(".wav")

    ref = voices.find(args.voice)
    if ref is None:
        sys.exit(f"no voice {args.voice!r}\navailable: {', '.join(voices.available()) or 'none'}")

    # One generate call stops at max_tokens (1024 frames ~ 47s), so long text
    # goes paragraph by paragraph (split on blank lines).
    paragraphs = [" ".join(p.split()) for p in re.split(r"\n\s*\n", text) if p.strip()]

    from mlx_audio.tts.utils import load_model
    from mlx_audio.utils import load_audio

    model = load_model(MODEL)
    sr = model.sample_rate
    ref_audio = load_audio(str(ref), sample_rate=sr)
    ref_text = ref.with_suffix(".txt").read_text().strip()
    silence = np.zeros(int(PAUSE * sr), dtype=np.float32)
    start = time.time()
    pieces = []
    for n, para in enumerate(paragraphs, 1):
        results = model.generate(
            text=para, ref_audio=ref_audio, ref_text=ref_text, max_tokens=2048,
        )
        audio = np.concatenate([np.array(r.audio) for r in results])
        pieces += [audio, silence]
        print(f"[{n}/{len(paragraphs)}] {len(audio) / sr:.1f}s  {para[:50]}")
    sf.write(dest, np.concatenate(pieces[:-1]), sr)
    if args.speed != 1.0:
        # atempo keeps pitch; the model's own speed option resamples and raises it
        tmp = dest.with_suffix(".tmp.wav")
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(dest),
             "-filter:a", f"atempo={args.speed}", str(tmp)],
            check=True,
        )
        tmp.replace(dest)
    secs = sf.info(dest).duration
    print(f"{dest}: {secs:.1f}s audio in {time.time() - start:.1f}s")


if __name__ == "__main__":
    main()
