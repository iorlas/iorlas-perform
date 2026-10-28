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
the first. `.txt` files use the older one-turn-per-line format. A scenario inside a profile
gets the profile's voices, levels.json and, unless --no-intro, its
episodes/00-intro.md played first. The lint runs first: errors
stop the render before the model loads (--no-lint skips it).

Spacing: `voice@0.1: text` sets the gap before that turn, in seconds, instead of
--gap. A negative gap overlaps the previous turn: `girl@-0.8: Что?!` starts
0.8 s before the previous turn ends, and the two are mixed. Each clip's silent
edges are trimmed first, so gaps are exact.

Ambience (ambience.py): `> ambience night` under a scene heading (`.txt`:
`@scene ... | ambience night`) puts a background bed under that scene, crossfading from the previous one so it is fully up as the
scene's first turn starts; `ambience rain 0.5` sets its volume (1 = default,
low under speech). A scene without ambience fades the bed out. `- {ambience NAME}`
or `- {ambience off}` changes the bed mid-scene. The bed ducks while anyone
speaks. Beds: office, kitchen, evening, night, rain, wind.

Phone line: `- vadik+phone: Алло?` renders that turn through a telephone band.

Sound effects (sfx.py): `- {sfx phone_ring}` plays an effect after the previous
turn, spaced like a turn (--gap); `- {sfx modem 0.6 @-1.5}` sets volume and gap,
a negative gap overlapping the previous turn. The next turn follows the effect;
give that turn a negative gap to speak over it.

Writes the wav and <out>.timeline.json: start and end of every turn in seconds,
so screen changes can follow the audio, then one entry per sound effect and per
ambience bed.

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
from typing import Any

import numpy as np
import soundfile as sf

import ambience
import engines
import profiles
import scenario
import sfx
import voices
from scenario import Ambience, Pause, Scenario, Scene, Sfx, Turn


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("out", nargs="?")
    p.add_argument("--gap", type=float, default=0.35, help="silence between turns, seconds")
    p.add_argument("--speed", type=float, default=1.1, help="tempo, pitch kept (default: 1.1)")
    p.add_argument("--engine", choices=engines.ENGINES, default=engines.DEFAULT)
    p.add_argument("--max-silence", type=float, default=0.6, help="shorten silences inside a turn to this, seconds (0: keep)")
    p.add_argument("--scene-pause", type=float, default=1.5, help="silence before each scene, seconds")
    p.add_argument("--no-lint", action="store_true", help="render even when the lint finds errors")
    p.add_argument("--clips", type=Path, help="also save each turn as <dir>/NN_voice.wav")
    p.add_argument("--no-intro", action="store_true", help="skip the profile's episodes/00-intro.md")
    return p.parse_args()


def check_names(sc: Scenario) -> None:
    """Exit on a bed or an effect that does not exist, before the model loads."""
    beds = [(i.ambience, i.line) for i in sc.items if isinstance(i, (Scene, Ambience)) and i.ambience]
    for name, line in beds:
        if name != "off" and name not in ambience.BEDS:
            sys.exit(f"line {line}: no ambience '{name}', have: off, {', '.join(ambience.BEDS)}")
    for i in sc.items:
        if isinstance(i, Sfx) and i.name not in sfx.EFFECTS:
            sys.exit(f"line {i.line}: no sfx '{i.name}', have: {', '.join(sfx.EFFECTS)}")


def read_levels(profile: Path, needed: set[str]) -> dict[str, dict[str, Any]]:
    """The profile's per-voice levels.json (from calibrate.py), logged for the voices in use."""
    log(f"profile: {profile.name} ({profile})")
    if not (profile / "levels.json").exists():
        return {}
    levels = json.loads((profile / "levels.json").read_text()).get("voices", {})
    log(
        "levels: "
        + ", ".join(
            f"{v} {gain_db(levels, v):+.1f} dB" + (f" {levels[v]['semitones']:+g} st" if levels[v].get("semitones") else "")
            for v in sorted(needed)
            if v in levels
        )
    )
    return levels


def find_voices(needed: set[str], first: list[Path]) -> dict[str, Path]:
    """Reference wav per voice; exits naming every voice that has none."""
    found = {v: voices.find(v, first) for v in needed}
    missing = sorted(v for v, wav in found.items() if wav is None)
    if missing:
        sys.exit(f"no voice: {', '.join(missing)}\navailable: {', '.join(voices.available(first))}")
    return {v: wav for v, wav in found.items() if wav is not None}


def speak_turn(
    model: engines.TTSModel, item: Turn, ref: tuple[Any, str], args: argparse.Namespace, levels: dict[str, dict[str, Any]]
) -> np.ndarray:
    """One turn as audio: generated, tempo and pitch set, edges trimmed, silences squashed, phone band, voice gain."""
    sr = model.sample_rate
    ref_audio, ref_text = ref
    results = model.generate(text=item.text, ref_audio=ref_audio, ref_text=ref_text, max_tokens=2048)
    audio = np.concatenate([np.array(r.audio) for r in results])
    if args.speed != 1.0 or semitones_of(levels, item.voice):
        audio = atempo(audio, sr, args.speed, semitones_of(levels, item.voice))
    audio = trim(audio, sr)
    if args.max_silence:
        audio = squash(audio, sr, args.max_silence)
    if item.phone:
        audio = phone_line(audio, sr)
    if item.voice in levels:  # one fixed gain per voice, from calibrate.py
        audio = audio * 10 ** (gain_db(levels, item.voice) / 20)
    return audio


def mix_down(
    placed: list[tuple[int, np.ndarray]],
    effects: list[tuple[int, Sfx, np.ndarray]],
    changes: list[tuple[int, str, float]],
    end: int,
    sr: int,
    *,
    timeline: list[dict[str, Any]],
) -> np.ndarray:
    """Speech, effects at SFX_DB under it, then the beds; effects and beds are added to the timeline."""
    mix = np.zeros(end, dtype=np.float32)
    for at, audio in placed:
        mix[at : at + len(audio)] += audio
    if effects:
        gain = (ambience.loudness(mix, sr) or 0.1) * 10 ** (-sfx.SFX_DB / 20)
        for at, item, audio in effects:
            mix[at : at + len(audio)] += audio * gain * (item.volume or 1.0)
            timeline.append(
                {
                    "sfx": item.name,
                    "volume": item.volume or 1.0,
                    "start": round(at / sr, 3),
                    "end": round((at + len(audio)) / sr, 3),
                }
            )
    if any(name != "off" for _, name, _ in changes):
        bed, segments = ambience.render(changes, mix, sr)
        mix = np.pad(mix, (0, len(bed) - len(mix))) + bed
        timeline += segments
        for seg in segments:
            log(f"ambience: {seg['ambience']} {clock(seg['start'])}-{clock(seg['end'])}")
    peak = np.abs(mix).max()
    if peak > 0.99:  # overlaps can clip
        mix *= 0.99 / peak
    return mix


def main() -> None:
    args = parse_args()

    dest = Path(args.out) if args.out else Path(args.src).with_suffix(".wav")
    sc = scenario.load(args.src)
    if not scenario.report(scenario.lint(sc), args.src) and not args.no_lint:
        sys.exit("[perform] lint errors: fix them or pass --no-lint")
    check_names(sc)
    profile = profiles.of(args.src)
    intro = profile / "episodes" / profiles.INTRO if profile else None
    if intro and intro.exists() and not args.no_intro and Path(args.src).resolve() != intro.resolve():
        sc.items = scenario.load(intro).items + sc.items  # the series intro opens every episode
        log(f"intro: {intro.name}")
    needed = {t.voice for t in sc.turns}
    first = [profile / "voices"] if profile else []
    levels = read_levels(profile, needed) if profile else {}
    voice_wavs = find_voices(needed, first)

    from mlx_audio.utils import load_audio

    model = engines.load_engine(args.engine)
    sr = model.sample_rate
    refs: dict[str, tuple[Any, str]] = {}
    for v, wav in voice_wavs.items():
        transcript = wav.with_suffix(".txt").read_text().strip()
        refs[v] = (load_audio(str(wav), sample_rate=sr), engines.ref_text(args.engine, transcript))
    clip_log: dict[str, dict[str, Any]] = {}  # what was applied to each clip, so calibrate.py can measure the raw voice
    if args.clips:
        args.clips.mkdir(parents=True, exist_ok=True)

    # Clips are placed on a timeline, not concatenated, so a negative gap can overlap.
    placed: list[tuple[int, np.ndarray]] = []
    timeline: list[dict[str, Any]] = []
    effects: list[tuple[int, Sfx, np.ndarray]] = []
    changes: list[tuple[int, str, float]] = []  # ambience changes: placed (sample, name, volume)
    pending: list[tuple[str, float]] = []  # ambience changes waiting for a turn
    # A scenario that opens on a bed lets it fade in before the first word.
    opener = sc.items[0] if sc.items else None
    lead = int(ambience.XFADE * sr) if isinstance(opener, (Scene, Ambience)) and opener.ambience else 0
    end = lead  # sample where the previous turn (or pause) ends
    turns = sc.turns
    total_chars, done_chars, done_turns = sum(len(t.text) for t in turns), 0, 0
    log(f"{len(turns)} turns, {len(sc.scenes)} scenes, {len(needed)} voices, {total_chars} chars; ETA after the first turn")
    start, scene = time.time(), None
    for n, item in enumerate(sc.items, 1):
        if isinstance(item, Pause):
            end += int(item.secs * sr)
            continue
        if isinstance(item, Scene):
            if placed or effects:
                end += int(args.scene_pause * sr)
            scene = item
            log(f"scene: {item.title}" + (f" | ambience {item.ambience}" if item.ambience else ""))
            if item.ambience or changes or pending:  # a scene without a bed silences the last one
                pending.append((item.ambience or "off", item.volume or 1.0))
            continue
        if isinstance(item, Ambience):
            pending.append((item.ambience, item.volume or 1.0))
            continue
        if isinstance(item, Sfx):  # placed like a turn; its level is set once the speech is known
            audio = sfx.make(item.name, sr, seed=n)
            at = max(0, end + int((args.gap if item.gap is None else item.gap) * sr)) if placed or effects else lead
            effects.append((at, item, audio))
            end = max(end, at + len(audio))
            log(f"sfx: {item.name} at {clock(at / sr)}, {len(audio) / sr:.1f}s")
            continue
        voice, text, gap = item.voice, item.text, item.gap
        t0 = time.time()
        audio = speak_turn(model, item, refs[voice], args, levels)
        if args.clips:
            sf.write(args.clips / f"{n:02d}_{voice}.wav", audio, sr)
            clip_log[f"{n:02d}_{voice}.wav"] = {
                "voice": voice,
                "gain_db": gain_db(levels, voice) if voice in levels else 0,
                "semitones": semitones_of(levels, voice),
                "phone": item.phone,
            }
        at = max(0, end + int((args.gap if gap is None else gap) * sr)) if placed or effects else lead
        changes += [(at, name, vol) for name, vol in pending]
        pending = []
        placed.append((at, audio))
        end = max(end, at + len(audio))
        timeline.append(
            {
                "turn": n,
                "voice": voice,
                "text": text,
                "scene": scene.title if scene else None,
                "ambience": scene.ambience if scene else None,
                "start": round(at / sr, 3),
                "end": round((at + len(audio)) / sr, 3),
            }
            | ({"phone": True} if item.phone else {})
        )
        # ETA scales the time so far by the characters left: render time follows text length.
        done_turns, done_chars = done_turns + 1, done_chars + len(text)
        elapsed = time.time() - start
        eta = elapsed / done_chars * (total_chars - done_chars)
        log(
            f"{done_turns}/{len(turns)} {done_chars * 100 // total_chars}% {voice}: "
            f"{len(audio) / sr:.1f}s audio in {time.time() - t0:.1f}s | "
            f"elapsed {clock(elapsed)}, ETA {clock(eta)} | {text[:40]}"
        )

    changes += [(end, name, vol) for name, vol in pending]
    mix = mix_down(placed, effects, changes, end, sr, timeline=timeline)
    sf.write(dest, mix, sr)
    if args.clips:
        (args.clips / "clips.json").write_text(json.dumps(clip_log, indent=2) + "\n")
    dest.with_suffix(".timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n")
    took, length = time.time() - start, len(mix) / sr
    log(f"done: {length:.1f}s audio in {clock(took)} ({length / took:.2f}x real time)")
    print(f"{dest}: {length:.1f}s audio in {took:.1f}s")


def log(msg: str) -> None:
    print(f"[perform] {msg}", flush=True)


def clock(secs: float) -> str:
    return f"{int(secs) // 60}m{int(secs) % 60:02d}s"


def trim(audio: np.ndarray, sr: int, keep: float = 0.03) -> np.ndarray:
    """Cut silent edges (below 2% of peak), keeping `keep` seconds of margin."""
    loud = np.where(np.abs(audio) > 0.02 * np.abs(audio).max())[0]
    if not len(loud):
        return audio
    margin = int(keep * sr)
    return audio[max(0, loud[0] - margin) : loud[-1] + margin]


def squash(audio: np.ndarray, sr: int, longest: float, step: float = 0.01) -> np.ndarray:
    """Shorten silent runs inside a clip (below 2% of peak) to `longest` seconds.

    The model sometimes stops for 2-4 s at a dash or a [short pause] tag; on a
    timeline that reads as dead air, not as acting.
    """
    hop = int(step * sr)
    frames = len(audio) // hop
    quiet = np.abs(audio[: frames * hop]).reshape(frames, hop).max(axis=1) < 0.02 * np.abs(audio).max()
    keep, run = int(longest / step), 0
    out: list[np.ndarray] = []
    for i, q in enumerate(quiet):
        run = run + 1 if q else 0
        if run <= keep:
            out.append(audio[i * hop : (i + 1) * hop])
    out.append(audio[frames * hop :])
    return np.concatenate(out)


def gain_db(levels: dict[str, dict[str, Any]], voice: str) -> float:
    return levels[voice].get("gain_db", 0) + levels[voice].get("offset_db", 0)


def semitones_of(levels: dict[str, dict[str, Any]], voice: str) -> float:
    return levels.get(voice, {}).get("semitones", 0)


def atempo(audio: np.ndarray, sr: int, speed: float, semitones: float = 0) -> np.ndarray:
    """Tempo change with pitch kept; per turn so the timeline stays exact.

    semitones shifts the pitch (and timbre) by resampling, then corrects the tempo.
    """
    ratio = 2 ** (semitones / 12)
    chain = f"asetrate={sr * ratio:.0f},aresample={sr},atempo={speed / ratio:.5f}" if semitones else f"atempo={speed}"
    return ffmpeg(audio, sr, chain)


def phone_line(audio: np.ndarray, sr: int) -> np.ndarray:
    """A voice heard through a phone: 300-3400 Hz band, slightly overdriven."""
    audio = ffmpeg(audio, sr, "highpass=f=300,highpass=f=300,lowpass=f=3400,lowpass=f=3400")
    peak = np.abs(audio).max() or 1.0
    return np.tanh(2.5 * audio / peak) * peak / np.tanh(2.5)


def ffmpeg(audio: np.ndarray, sr: int, filters: str) -> np.ndarray:
    out = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", "-filter:a", filters, "-f", "f32le", "-"],
        input=audio.astype(np.float32).tobytes(),
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.float32)


if __name__ == "__main__":
    main()
