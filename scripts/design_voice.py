# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlx-audio>=0.6.2", "soundfile", "praat-parselmouth"]
# ///
"""Design a voice from a text description with Qwen3-TTS VoiceDesign.

The voice is saved as <name>.wav + <name>.txt in $PERFORM_VOICES or ./voices,
ready for speak.py --voice <name>.

Fish copies the reference's delivery as well as its timbre, so write the
description with personality and mannerisms, not only age and pitch, and give
a --line in character.

With --profile, a voice must also be told apart from the profile's cast (rule C6
in the scenario skill). The designer makes --tries takes; each is scored against
the stored voices (voice_similarity.py --check, from voices/similarity.json) and
the report says, per take: its pitch, its nearest voices with their score and
pitch gap, and the verdict. The most distinct take under the profile's
voice_sim_max is saved; the others stay in voices/candidates/. When every take is
too close, nothing is saved, the script says which voice each take sounds like and
where the free pitch room is, and exits 1; --force saves the best take anyway.

The description sets pitch only loosely: Qwen's "old Russian man" lands near the
same timbre whatever the adjectives. --pitch HZ moves each take to that median
pitch, and --formant RATIO scales its vocal tract (under 1: bigger, older,
darker; over 1: smaller, younger), with Praat. On senior-vadik a formant of 0.88
and a pitch of 88 Hz took mikhalych from 0.43 to 0.25 against palych, where two
richer descriptions did not (0.37 and 0.52).

Usage:
    uv run design_voice.py NAME "description in English" [--line "Русская фраза"] [--profile DIR]
        [--tries 3] [--pitch HZ] [--formant RATIO] [--force]
    uv run design_voice.py --presets        # re-make the bundled voices
"""

import argparse
import json
import shutil
import subprocess
import sys
import time
from itertools import pairwise
from pathlib import Path

import numpy as np
import soundfile as sf

import engines
import profiles
import voices

# Reference line: varied intonation, ~10s, so the clone has something to copy.
LINE = "Так, слушай сюда внимательно. Я два раза повторять не буду. Ну что, понял? Вот и молодец, давай, иди работай."
SIMILARITY = Path(__file__).resolve().parent / "voice_similarity.py"
ROOM = 3  # semitones: a free pitch band is at least this far from every voice

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


def reshape(wav: Path, pitch: float | None, formant: float) -> None:
    """Praat's Change gender, in place: the median pitch to `pitch` Hz (None keeps it), formants times `formant`."""
    import parselmouth
    from parselmouth.praat import call

    sound = parselmouth.Sound(str(wav))
    call(sound, "Change gender", 60, 500, formant, pitch or 0, 1.0, 1.0).save(str(wav), "WAV")


def score(prof: Path, takes: list[Path], replaces: str) -> list[dict]:
    """voice_similarity.py --check on every take: its nearest voices and a verdict."""
    if not (prof / "voices" / "similarity.json").exists():
        print("no voices/similarity.json yet: scoring the profile's voices first", flush=True)
        subprocess.run(["uv", "run", str(SIMILARITY), str(prof)], check=True)
    cmd = ["uv", "run", str(SIMILARITY), str(prof), "--replaces", replaces]
    for t in takes:
        cmd += ["--check", str(t)]
    return json.loads(subprocess.run(cmd, check=True, capture_output=True, text=True).stdout)


def free_pitch(result: dict) -> str:
    """Pitch bands at least ROOM semitones from every stored voice, within 70-400 Hz."""
    step = 2 ** (ROOM / 12)
    taken = sorted({x["f0_hz"] for x in result["nearest"] if x["f0_hz"]})
    edges = [70 / step, *taken, 400 * step]
    bands = [f"{lo * step:.0f}-{hi / step:.0f} Hz" for lo, hi in pairwise(edges) if hi / step > lo * step]
    return ", ".join(bands) or "none"


def explain(n: int, r: dict, asked: float | None) -> str:
    """One take, said so an agent can act on it: what came out, what it sounds like, why it passes or not."""
    pitch = f"{r['f0_hz']} Hz" + (f" (moved to the asked {asked:g} Hz)" if asked else "")
    lines = [f"take {n}: pitch {pitch}, {r['verdict']} (limit {r['limit']:g})"]
    for x in r["nearest"][:3]:
        gap = f"{x['semitones']:+.1f} semitones from its {x['f0_hz']} Hz" if x["semitones"] is not None else "pitch unknown"
        mark = "  <- over the limit" if x["score"] > r["limit"] else ""
        lines.append(f"  sounds {x['score']:.2f} like {x['voice']}, {gap}{mark}")
    close = [x for x in r["nearest"] if x["score"] > r["limit"]]
    if close and close[0]["semitones"] is not None and abs(close[0]["semitones"]) >= ROOM:
        lines.append(f"  pitch is not the problem ({close[0]['semitones']:+.1f} st apart), timbre is: try --formant or other texture words")
    elif close:
        lines.append(f"  same pitch range as {close[0]['voice']}: move the pitch (--pitch) and the timbre (--formant), not only the words")
    return "\n".join(lines)


def design(model: engines.TTSModel, description: str, line: str) -> np.ndarray:
    results = list(model.generate_voice_design(text=line, language="Russian", instruct=description))
    return np.concatenate([np.array(r.audio) for r in results])


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("name", nargs="?")
    p.add_argument("description", nargs="?")
    p.add_argument("--line", default=LINE, help="Russian reference line, ~10s, in character")
    p.add_argument("--presets", action="store_true", help="make the bundled voices")
    p.add_argument("--profile", help="write into this profile's voices/ (a name or a folder), checked against its cast")
    p.add_argument("--tries", type=int, default=3, help="takes to design with --profile; the most distinct is kept (default: 3)")
    p.add_argument("--pitch", type=float, help="move each take's median pitch to this, Hz")
    p.add_argument("--formant", type=float, default=1.0, help="scale each take's formants: <1 bigger and darker, >1 smaller")
    p.add_argument("--force", action="store_true", help="save the best take even when it is too close to a cast voice")
    args = p.parse_args()
    shaped = bool(args.pitch) or args.formant != 1.0

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
    if not args.profile:
        for name, description, line in jobs:
            t = time.time()
            audio = design(model, description, line)
            sf.write(out / f"{name}.wav", audio, model.sample_rate)
            if shaped:
                reshape(out / f"{name}.wav", args.pitch, args.formant)
            (out / f"{name}.txt").write_text(line + "\n")
            print(f"{out / name}.wav: {len(audio) / model.sample_rate:.1f}s audio in {time.time() - t:.1f}s")
        return

    checked(model, jobs[0], out, args)


def checked(model: engines.TTSModel, job: tuple[str, str, str], out: Path, args: argparse.Namespace) -> None:
    """Design --tries takes, score each against the profile's cast, save the most distinct or explain why not."""
    name, description, line = job
    shaped = bool(args.pitch) or args.formant != 1.0
    cand = out / "candidates"
    cand.mkdir(exist_ok=True)
    takes = []
    for n in range(1, args.tries + 1):
        t = time.time()
        take = cand / f"{name}-{n}.wav"
        sf.write(take, design(model, description, line), model.sample_rate)
        if shaped:
            reshape(take, args.pitch, args.formant)
        take.with_suffix(".txt").write_text(line + "\n")
        takes.append(take)
        print(f"take {n}: designed in {time.time() - t:.1f}s", flush=True)

    results = score(out.parent, takes, name)
    for n, r in enumerate(results, 1):
        print(explain(n, r, args.pitch))
    best = min(range(len(results)), key=lambda i: results[i]["nearest"][0]["score"] if results[i]["nearest"] else 0)
    ok = results[best]["verdict"] == "ok"
    if not ok and not args.force:
        top = results[best]["nearest"][0]
        sys.exit(
            f"not saved: every take is too close to a cast voice; the best, take {best + 1}, sounds "
            f"{top['score']:.2f} like {top['voice']} (limit {results[best]['limit']:g}).\n"
            f"Free pitch room, {ROOM}+ semitones from every voice: {free_pitch(results[best])}.\n"
            f"Change an axis the ear hears (age, pitch, pace, accent, energy), or --pitch/--formant; "
            f"--force saves take {best + 1} anyway. Takes: {cand}"
        )
    for ext in (".wav", ".txt"):
        shutil.copy(takes[best].with_suffix(ext), out / f"{name}{ext}")
    why = "the most distinct" if ok else "forced, still too close"
    print(f"{out / name}.wav: take {best + 1}, {why}. Rerun voice_similarity.py {out.parent} to refresh the lint's scores.")


if __name__ == "__main__":
    main()
