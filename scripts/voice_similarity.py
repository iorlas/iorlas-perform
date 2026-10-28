# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["torch", "torchaudio", "speechbrain", "librosa", "soundfile", "numpy"]
# ///
"""Score how alike a profile's voices sound; write voices/similarity.json for the lint.

Listeners lose track of who speaks when two voices share a timbre, so every pair of
voices gets a speaker-similarity score from ECAPA-TDNN (speechbrain, VoxCeleb), the
cosine of the two speaker embeddings, plus each voice's median pitch and speech rate.
A voice is scored from its reference and, when the profile has them, from rendered
clips (renders/*_clips/NN_voice.wav): what Fish makes of the reference is what the
listener hears. The scenario lint (C6) warns on a cast pair over `voice_sim_max`.

A voice's embedding is the mean over its reference and clips. Measured on the
profile senior-vadik (2026-10-28): one voice against itself, split in half, scores
0.88-0.94; two designed voices 0.11-0.44, and the pair listeners mixed up (two low
50-60-year-old men, mikhalych and palych) was the top one, at 0.44. The file records
each voice's sha1, so the lint knows when it is stale, and its embedding, so a new
voice is checked against the cast without scoring everything again.

    {
      "model": "speechbrain/spkrec-ecapa-voxceleb",
      "voices": {"vadik": {"sha1": "...", "f0_hz": 227, "syll_per_s": 3.6, "clips": 20, "embedding": [...]}},
      "pairs": {"mikhalych|palych": 0.31}
    }

Usage:
    uv run voice_similarity.py PROFILE            # a profile name or folder
    uv run voice_similarity.py PROFILE --clips renders/01-x_clips
    uv run voice_similarity.py PROFILE --check new.wav [--replaces NAME]   # JSON verdict, writes nothing

--check scores a candidate (design_voice.py runs it on every take) against the stored
voices: its nearest voices by similarity, with their pitch and the gap in semitones,
and a verdict, "too close" when any score is over the profile's voice_sim_max.
"""

import argparse
import hashlib
import json
import re
from collections.abc import Callable
from itertools import combinations
from pathlib import Path

import librosa
import numpy as np

import profiles
import scenario

SR = 16000
MODEL = "speechbrain/spkrec-ecapa-voxceleb"
VOWELS = re.compile(r"[аеёиоуыэюяaeiou]", re.IGNORECASE)


def speech(y: np.ndarray) -> np.ndarray:
    """The audio without its silences."""
    parts = librosa.effects.split(y, top_db=35)
    return np.concatenate([y[a:b] for a, b in parts]) if len(parts) else y


def f0_of(y: np.ndarray) -> int | None:
    """Median pitch of voiced frames, Hz."""
    f0, voiced, _ = librosa.pyin(y, fmin=60, fmax=500, sr=SR, frame_length=1024)
    return round(float(np.nanmedian(f0[voiced]))) if voiced.any() else None


def encoder() -> Callable[[np.ndarray], np.ndarray]:
    """ECAPA, as a function from audio to its unit speaker embedding."""
    import torch
    from speechbrain.inference.speaker import EncoderClassifier

    ecapa = EncoderClassifier.from_hparams(MODEL, savedir=str(Path.home() / ".cache" / "perform" / "ecapa"))

    def embed(y: np.ndarray) -> np.ndarray:
        with torch.no_grad():
            e = ecapa.encode_batch(torch.tensor(speech(y)[: SR * 20])[None]).squeeze().cpu().numpy()
        return e / np.linalg.norm(e)

    return embed


def check(prof: Path, wavs: list[Path], replaces: str | None) -> list[dict]:
    """Each wav against the stored voices (except the one it replaces): nearest first, and a verdict."""
    stored = json.loads((prof / "voices" / "similarity.json").read_text())["voices"]
    limit = scenario.Rules.of(prof / "characters.md").voice_sim_max
    embed = encoder()
    out = []
    for wav in wavs:
        y = speech(librosa.load(wav, sr=SR)[0])
        e, f0 = embed(y), f0_of(y)
        near = []
        for name, v in stored.items():
            if name == replaces or "embedding" not in v:
                continue
            gap = round(12 * np.log2(f0 / v["f0_hz"]), 1) if f0 and v["f0_hz"] else None
            score = round(float(e @ np.array(v["embedding"])), 3)
            near.append({"voice": name, "score": score, "f0_hz": v["f0_hz"], "semitones": gap})
        near.sort(key=lambda x: -x["score"])
        verdict = "too close" if any(x["score"] > limit for x in near) else "ok"
        out.append({"wav": str(wav), "f0_hz": f0, "limit": limit, "nearest": near, "verdict": verdict})
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("profile")
    p.add_argument("--clips", type=Path, action="append", help="clip folder(s); default: the newest renders/*_clips")
    p.add_argument("--check", type=Path, action="append", help="score this wav against the stored voices, print JSON, write nothing")
    p.add_argument("--replaces", help="with --check: the voice the wav would replace, left out of the comparison")
    args = p.parse_args()
    prof = profiles.writable(args.profile)
    if args.check:
        print(json.dumps(check(prof, args.check, args.replaces), ensure_ascii=False, indent=2))
        return
    refs = {w.stem: w for w in sorted((prof / "voices").glob("*.wav")) if w.with_suffix(".txt").exists()}
    folders = args.clips or sorted((prof / "renders").glob("*_clips"), key=lambda d: d.stat().st_mtime)[-1:]
    clips: dict[str, list[Path]] = {}
    for d in folders:
        for w in sorted((d if d.is_absolute() else prof / d).glob("*.wav")):
            if (m := re.match(r"\d+_([\w-]+)$", w.stem)) and m[1] in refs:
                clips.setdefault(m[1], []).append(w)

    embed = encoder()
    emb: dict[str, np.ndarray] = {}
    out: dict = {"model": MODEL, "voices": {}, "pairs": {}}
    for name, ref in refs.items():
        y, _ = librosa.load(ref, sr=SR)
        takes = [y] + [librosa.load(c, sr=SR)[0] for c in clips.get(name, [])]
        takes = [t for t in takes if len(speech(t)) > SR * 0.8]  # a one-word take says little about the voice
        e = np.mean([embed(t) for t in takes], axis=0)
        emb[name] = e / np.linalg.norm(e)
        s = speech(y)
        out["voices"][name] = {
            "sha1": hashlib.sha1(ref.read_bytes(), usedforsecurity=False).hexdigest(),
            "f0_hz": f0_of(s),
            "syll_per_s": round(len(VOWELS.findall(ref.with_suffix(".txt").read_text())) / (len(s) / SR), 1),
            "clips": len(takes) - 1,
            "embedding": [round(float(x), 5) for x in emb[name]],
        }
    for a, b in combinations(sorted(emb), 2):
        out["pairs"][f"{a}|{b}"] = round(float(emb[a] @ emb[b]), 3)
    dest = prof / "voices" / "similarity.json"
    dest.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"{dest}: {len(emb)} voices, clips from {', '.join(d.name for d in folders) or 'none'}")
    for key, score in sorted(out["pairs"].items(), key=lambda x: -x[1])[:8]:
        print(f"  {score:.2f}  {key.replace('|', ' - ')}")


if __name__ == "__main__":
    main()
