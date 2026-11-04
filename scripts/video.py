#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = []
# ///
"""Turn a finished scene (wav + timeline) into a video: scene.py --video calls this, or run it on files that exist.

    uv run video.py out/night_shift.wav out/night_shift.timeline.json [--sheet S.json] [--out DIR] [--chrome PATH]

Python owns everything up to shots.json (videoplan.py: timeline v2, sheet, resolver, mouth), then calls
`node video/engine/render.mjs` once per scene (the Node adapter: rig.lock check, cache key, Remotion),
then joins the per-scene mp4s with ffmpeg and muxes the mastered wav under them.

The sheet defaults to <wav stem>.sheet.json next to the wav; written from video/layout.json when missing, never overwritten.
Needs Node >= 20 and `npm ci` in video/engine. Scenes are cached by content: re-running re-renders only what changed.
"""

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import videoplan

ROOT = Path(__file__).resolve().parent.parent / "video"
ENGINE_DIR = ROOT / "engine"
LAYOUT = ROOT / "layout.json"


def log(msg: str) -> None:
    print(f"[video] {msg}", file=sys.stderr, flush=True)


def probe(path: Path) -> dict[str, Any]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,codec_type,width,height,r_frame_rate,pix_fmt:format=duration", "-of", "json", path],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    return json.loads(out)


def signature(path: Path) -> str:
    """The stream parameters copy-concat needs equal across files."""
    return json.dumps([[s.get(k) for k in ("codec_type", "codec_name", "width", "height", "r_frame_rate", "pix_fmt")] for s in probe(path)["streams"]])


def render_scene(scene_dir: Path, cache: Path, chrome: str | None, work: Path) -> dict[str, Any]:
    """One `node render.mjs` call: {id, key, file, hit, seconds, engine, adapter, codec}. Raises with node's reason on failure."""
    cmd = ["node", str(ENGINE_DIR / "render.mjs"), "--scene", str(scene_dir), "--cache", str(cache), "--work", str(work)]
    if chrome:
        cmd += ["--chrome", chrome]
    r = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if r.returncode:
        msg = f"render {scene_dir.name} failed: {r.stderr.strip() or r.stdout.strip()}"
        raise RuntimeError(msg)
    return json.loads(r.stdout.strip().splitlines()[-1])


def join_and_mux(files: list[Path], audio: Path, dest: Path) -> None:
    """Copy-concat the per-scene videos (refused unless every file has the same parameters), mux the mastered wav under them."""
    if len({signature(f) for f in files}) > 1:
        msg = "cannot concat: scene videos differ in codec parameters (mixed engines or settings)"
        raise RuntimeError(msg)
    with tempfile.TemporaryDirectory() as tmp:
        lst = Path(tmp) / "list.txt"
        lst.write_text("".join(f"file '{f.resolve()}'\n" for f in files))
        video = Path(tmp) / "video.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", video], check=True)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", dest],
            check=True,
        )


def make(
    audio: Path, v1: list[dict[str, Any]], *, sr: int, duration: float, out: Path, sheet_path: Path | None = None, chrome: str | None = None
) -> Path:
    """wav + scene.py timeline -> out/<stem>.mp4. Returns the mp4."""
    out.mkdir(parents=True, exist_ok=True)
    tl = videoplan.timeline_v2(v1, audio=audio.name, duration=duration, sr=sr)
    (out / "timeline.v2.json").write_text(json.dumps(tl, ensure_ascii=False, indent=2) + "\n")
    sheet_path = sheet_path or audio.with_suffix(".sheet.json")
    if sheet_path.exists():
        log(f"sheet: {sheet_path} (yours, not rewritten)")
    else:
        sheet_path.write_text(json.dumps(videoplan.emit_sheet(tl, json.loads(LAYOUT.read_text())), ensure_ascii=False, indent=2) + "\n")
        log(f"sheet: wrote default {sheet_path}; edit its cues to act the scenes")
    sheet = json.loads(sheet_path.read_text())
    groups = videoplan.plan(tl, sheet, audio, out / "scenes")
    results = []
    for g in groups:
        r = render_scene(g["dir"], out / "cache", chrome, out / "work")
        log(f"{g['id']} {g['title']}: {'cache hit' if r['hit'] else f'rendered in {r['seconds']:.1f}s'} {r['key'][:12]}")
        results.append(r)
    if len({(r["engine"], r["adapter"], r["codec"]) for r in results}) > 1:
        msg = "scene videos come from different engines or adapter versions: refusing to join"
        raise RuntimeError(msg)
    dest = out / f"{audio.stem}.mp4"
    join_and_mux([Path(r["file"]) for r in results], audio, dest)
    (out / "manifest.json").write_text(json.dumps({"audio": audio.name, "scenes": results}, indent=1) + "\n")
    log(f"video: {dest}")
    return dest


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("audio", type=Path)
    p.add_argument("timeline", type=Path, help="scene.py's <out>.timeline.json")
    p.add_argument("--sheet", type=Path)
    p.add_argument("--out", type=Path, help="default: <audio stem>.video next to the wav")
    p.add_argument("--chrome", help="Chrome/headless-shell binary (or PERFORM_CHROME)")
    a = p.parse_args()
    v1 = json.loads(a.timeline.read_text())
    sr, samples = videoplan.read_wav(a.audio)
    duration = len(samples) / sr
    make(a.audio, v1, sr=sr, duration=duration, out=a.out or a.audio.with_suffix(".video"), sheet_path=a.sheet, chrome=a.chrome)


if __name__ == "__main__":
    main()
