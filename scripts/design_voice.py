# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlx-audio>=0.6.2", "soundfile"]
# ///
"""Design a voice from a text description with Qwen3-TTS VoiceDesign.

The voice is saved as <name>.wav + <name>.txt in $PERFORM_VOICES or ./voices,
ready for speak.py --voice <name>.

Fish copies the reference's delivery as well as its timbre, so write the
description with personality and mannerisms, not only age and pitch, and give
a --line in character.

Usage:
    uv run design_voice.py NAME "description in English" [--line "Русская фраза"] [--profile DIR]
    uv run design_voice.py --presets        # re-make the bundled voices
"""
import argparse
import sys
import time

import numpy as np
import soundfile as sf

import engines
import profiles
import voices


# Reference line: varied intonation, ~10s, so the clone has something to copy.
LINE = ("Так, слушай сюда внимательно. Я два раза повторять не буду. "
        "Ну что, понял? Вот и молодец, давай, иди работай.")

PRESETS = {
    "praporshchik": (
        "A gruff, hoarse male voice of a 50-year-old Russian army warrant officer. "
        "Low, slightly raspy, loud and confident, sly and humorous, speaks fast "
        "with a strong southern Russian accent."
    ),
    "girl": (
        "A young Russian woman, about 22 years old. Bright, clear, warm voice, "
        "lively and playful, natural native Moscow pronunciation, medium-fast pace."
    ),
    "starik": (
        "An old Russian man, about 80 years old. Deep, creaky, slightly trembling "
        "voice, slow and wise, kind grandfatherly tone, native Russian pronunciation."
    ),
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("name", nargs="?")
    p.add_argument("description", nargs="?")
    p.add_argument("--line", default=LINE, help="Russian reference line, ~10s, in character")
    p.add_argument("--presets", action="store_true", help="make the bundled voices")
    p.add_argument("--profile", help="write into this profile's voices/ (a name or a folder)")
    args = p.parse_args()

    if args.presets:
        jobs = [(n, d, LINE) for n, d in PRESETS.items()]
        out = voices.BUNDLED
    elif args.name and args.description:
        jobs = [(args.name, args.description, args.line)]
        out = voices.user_dir()
        if args.profile:
            out = profiles.writable(args.profile) / "voices"
    else:
        p.print_usage()
        sys.exit(1)

    out.mkdir(parents=True, exist_ok=True)
    model = engines.load(*engines.VOICE_DESIGN)
    for name, description, line in jobs:
        t = time.time()
        results = list(model.generate_voice_design(
            text=line, language="Russian", instruct=description,
        ))
        audio = np.concatenate([np.array(r.audio) for r in results])
        sf.write(out / f"{name}.wav", audio, model.sample_rate)
        (out / f"{name}.txt").write_text(line + "\n")
        print(f"{out / name}.wav: {len(audio) / model.sample_rate:.1f}s audio in {time.time() - t:.1f}s")


if __name__ == "__main__":
    main()
