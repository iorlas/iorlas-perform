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

With a design file (<scenario>.design.json, see videodesign.py) the sheet is derived from it on every run. Without one the sheet\ndefaults to <wav stem>.sheet.json next to the wav, written from video/layout.json when missing and never overwritten.
Pre-production (no audio, no Remotion; docs/PREPRODUCTION.md), all take the scenario and its design file:

    uv run video.py storyboard SCENARIO.md [--format shorts-1080x1920] [--frames N]   one still per shot + contact sheet
    uv run video.py animatic   SCENARIO.md [--scratch-audio RENDER|TAKES_DIR]       draft mp4 on the estimated timeline
    uv run video.py capability SCENARIO.md                                          what the design needs vs what rigs/sets provide
    uv run video.py gates      SCENARIO.md [--timeline real.json] [--previous D..]  the checks; exit 1 on a blocking defect
    uv run video.py retime     SCENARIO.md --real out.timeline.json                 estimated -> real: what moved, what re-renders
    uv run video.py <audio> <timeline> --draft                                      the full engine at 640x360, 15 fps

Needs Node >= 20 and `npm ci` in video/engine. Scenes are cached by content: re-running re-renders only what changed.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import videodesign
import videoplan

ROOT = Path(__file__).resolve().parent.parent / "video"
ENGINE_DIR = ROOT / "engine"
LAYOUT = ROOT / "layout.json"
DRAFT_SIZE, DRAFT_FPS = [640, 360], 15


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


SCREEN = re.compile(r'<!--\s*screen:\s*(\w+)(?:\s+"([^"]*)")?\s*-->')


def scenario_marks(src: Path) -> tuple[list[int], list[dict[str, Any]]]:
    """From the scenario: item numbers of its `{pause}`s (scene splits) and `<!-- screen: STATE "text" -->` directives (each on the next turn)."""
    import scenario

    sc = scenario.load(str(src))
    text = src.read_text()
    found = [(text.count("\n", 0, m.start()) + 1, m[1], m[2]) for m in SCREEN.finditer(text)]
    breaks = [n for n, it in enumerate(sc.items, 1) if isinstance(it, scenario.Pause)]
    cues, done = [], 0
    for n, it in enumerate(sc.items, 1):
        if not isinstance(it, scenario.Turn):
            continue
        while done < len(found) and found[done][0] < it.line:
            _, state, shown = found[done]
            cues.append({"turn": n, "screen": state, **({"text": shown} if shown else {})})
            done += 1
    return breaks, cues


def make(
    audio: Path,
    v1: list[dict[str, Any]],
    *,
    sr: int,
    duration: float,
    out: Path,
    sheet_path: Path | None = None,
    chrome: str | None = None,
    scenario_src: Path | None = None,
    design_path: Path | None = None,
    only: list[str] | None = None,
    draft: bool = False,
) -> Path:
    """wav + scene.py timeline (+ the scenario, for pauses and screen directives) -> out/<stem>.mp4. Returns the mp4."""
    out.mkdir(parents=True, exist_ok=True)
    breaks, cues = scenario_marks(scenario_src) if scenario_src else ([], [])
    tl = videoplan.timeline_v2(v1, audio=audio.name, duration=duration, sr=sr, breaks=breaks, cues=cues)
    (out / "timeline.v2.json").write_text(json.dumps(tl, ensure_ascii=False, indent=2) + "\n")
    sheet_path = sheet_path or audio.with_suffix(".sheet.json")
    design_path = design_path or (scenario_src.with_suffix(".design.json") if scenario_src else None)
    layout = json.loads(LAYOUT.read_text())
    if design_path and design_path.exists():  # the design file is the input: the sheet is derived from it on every run
        sheet_path.write_text(json.dumps(videodesign.emit_sheet(tl, layout, json.loads(design_path.read_text())), ensure_ascii=False, indent=2) + "\n")
        log(f"sheet: derived from {design_path.name}")
    elif sheet_path.exists():
        log(f"sheet: {sheet_path} (yours, not rewritten)")
    else:
        sheet_path.write_text(json.dumps(videoplan.emit_sheet(tl, layout), ensure_ascii=False, indent=2) + "\n")
        log(f"sheet: wrote default {sheet_path}; edit its cues to act the scenes")
    sheet = json.loads(sheet_path.read_text())
    if draft:  # low-res profile: its own size and fps are part of shots.json, so draft and final scenes never share a cache entry
        sheet["size"], sheet["fps"] = DRAFT_SIZE, DRAFT_FPS
    groups = videoplan.plan(tl, sheet, audio, out / "scenes", ROOT / "assets", only)
    results = []
    for g in groups:
        r = render_scene(g["dir"], out / "cache", chrome, out / "work")
        log(f"{g['id']} {g['title']}: {'cache hit' if r['hit'] else f'rendered in {r['seconds']:.1f}s'} {r['key'][:12]}")
        results.append(r)
    if len({(r["engine"], r["adapter"], r["codec"]) for r in results}) > 1:
        msg = "scene videos come from different engines or adapter versions: refusing to join"
        raise RuntimeError(msg)
    dest = out / f"{audio.stem}{'.draft' if draft else ''}.mp4"
    if only:  # a slice: the mix is cut to the scenes that were rendered
        part = out / f"{audio.stem}.slice.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{groups[0]['t0']:.3f}", "-t", f"{groups[-1]['t1'] - groups[0]['t0']:.3f}", "-i", audio, part], check=True)
        audio = part
    join_and_mux([Path(r["file"]) for r in results], audio, dest)
    (out / "manifest.json").write_text(json.dumps({"audio": audio.name, "scenes": results}, indent=1) + "\n")
    log(f"video: {dest}")
    return dest


COMMANDS = ("storyboard", "animatic", "capability", "gates", "retime", "estimate")


def cli(argv: list[str]) -> int:
    """Pre-production commands: they need the script and the design file, never audio or Node."""
    import resource  # noqa: PLC0415

    import scenario  # noqa: PLC0415
    import videocapability  # noqa: PLC0415
    import videoestimate  # noqa: PLC0415
    import videogates  # noqa: PLC0415
    import videopreprod  # noqa: PLC0415
    import videoretime  # noqa: PLC0415

    cmd = argv[0]
    p = argparse.ArgumentParser(prog=f"video.py {cmd}")
    p.add_argument("scenario", type=Path)
    p.add_argument("--design", type=Path, help="design file (default: <scenario>.design.json next to the scenario)")
    p.add_argument("--layout", type=Path, help="layout file of the world (default: video/layout.json)")
    p.add_argument("--format", help="format profile id or path (video/formats/*.json): landscape-720 (default), landscape-3min, shorts-1080x1920")
    p.add_argument("--out", type=Path, help="default: <scenario stem>.pre next to the scenario")
    p.add_argument("--pace", type=Path, help='JSON {voice: characters per second} for the world; default pace is measured on Pravila (12.9)')
    p.add_argument("--chrome", help="Chrome binary (or PERFORM_CHROME)")
    p.add_argument("--json", action="store_true", help="print the report as JSON")
    if cmd == "storyboard":
        p.add_argument("--frames", type=int, default=1, help="stills per shot: 1 (middle) or 3 (start, middle, end)")
        p.add_argument("--clean", action="store_true", help="no safe-zone overlay and subject boxes")
        p.add_argument("--no-overlays", action="store_true", help="skip the extra still per overlay state")
        p.add_argument("--size", default="640x360", help="still size (default 640x360; 1280x720 for review)")
    if cmd == "animatic":
        p.add_argument("--scratch-audio", type=Path, help="a past render (<name>.wav + <name>.timeline.json) or a takes dir: matching lines are heard, and set the real duration")
        p.add_argument("--hud", action="store_true", help="draw the safe zones")
        p.add_argument("--no-subs", action="store_true")
    if cmd in {"gates", "retime"}:
        p.add_argument("--timeline", "--real", dest="timeline", type=Path, help="a real <out>.timeline.json: run on real timing instead of the estimate")
        p.add_argument("--hybrid", action="store_true", help="real seconds only for lines that did not change; estimates for the rest")
    if cmd == "gates":
        p.add_argument("--previous", nargs="*", type=Path, default=[], help="design files of earlier episodes (distinctness)")
        p.add_argument("--only", help="comma list of gates: capability,framing,rhythm,flicker,zones,textfit,shorts,distinct")
        p.add_argument("--warn-only", action="store_true", help="exit 0 even on blocking findings")
    if cmd == "retime":
        p.add_argument("--tol", type=float, default=0.15, help="flag shots whose duration moved by more than this fraction")
    a = p.parse_args(argv[1:])
    out = a.out or a.scenario.with_suffix(".pre")
    out.mkdir(parents=True, exist_ok=True)
    fmt = videopreprod.load_format(a.format)
    pace = videoestimate.load_pace(a.pace)
    t0, c0 = time.time(), resource.getrusage(resource.RUSAGE_SELF).ru_utime + resource.getrusage(resource.RUSAGE_CHILDREN).ru_utime

    def took() -> str:
        cpu = resource.getrusage(resource.RUSAGE_SELF).ru_utime + resource.getrusage(resource.RUSAGE_CHILDREN).ru_utime - c0
        return f"{time.time() - t0:.1f}s wall, {cpu:.1f}s cpu, load {os.getloadavg()[0]:.0f}"

    def entries_for(sc: Any, timeline: Path | None, hybrid: bool) -> tuple[list[dict[str, Any]] | None, str]:
        if not timeline:
            return None, "estimated"
        e, how = videoretime.real_entries(json.loads(timeline.read_text()), sc, hybrid)
        return e, how["mode"]

    if cmd == "retime":
        r = videoretime.retime(a.scenario, a.timeline, out, design=a.design, layout=a.layout, fmt=fmt, tol=a.tol, hybrid=a.hybrid)
        (out / "retime.json").write_text(json.dumps(r, ensure_ascii=False, indent=1) + "\n")
        (out / "retime.md").write_text(videoretime.markdown(r) + "\n")
        print(json.dumps(r, ensure_ascii=False, indent=1) if a.json else videoretime.markdown(r))
        log(f"retime: {took()}")
        return 0
    sc = scenario.load(a.scenario)
    known, clips = {}, {}
    if cmd == "animatic" and a.scratch_audio:
        known, clips = videopreprod.scratch_from(a.scratch_audio, sc, out / "scratch")
        log(f"scratch voice: {len(clips)} of {len(sc.turns)} turns found in {a.scratch_audio}")
    entries, mode = entries_for(sc, getattr(a, "timeline", None), getattr(a, "hybrid", False))
    size = None
    if cmd == "storyboard":
        size = tuple(int(x) for x in a.size.split("x"))
    plan = videopreprod.prepare(a.scenario, out, design=a.design, layout=a.layout, fmt=fmt, known=known, pace=pace, captions=cmd in {"animatic", "gates"} and not getattr(a, "no_subs", False), entries=entries)
    (out / "estimate.json").write_text(json.dumps(plan["entries"], ensure_ascii=False, indent=1) + "\n")
    log(f"timeline: {mode}, {plan['duration']:.1f}s, {len(plan['groups'])} scenes ({took()})")
    if cmd == "estimate":
        print(json.dumps(plan["entries"], ensure_ascii=False, indent=1) if a.json else f"{plan['duration']:.1f}s estimated, {len(plan['entries'])} entries -> {out / 'estimate.json'}")
        return 0
    if cmd == "capability":
        if not plan["design"]:
            sys.exit("no design file: capability needs <scenario>.design.json")
        rows = videocapability.check(sc, plan["design"], plan["layout"])
        (out / "capability.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n")
        (out / "capability.md").write_text(videocapability.markdown(rows, a.scenario.stem) + "\n")
        print(json.dumps(rows, ensure_ascii=False, indent=1) if a.json else videocapability.markdown(rows, a.scenario.stem))
        log(f"capability: {took()}")
        return 1 if any(r["status"] == "gap" for r in rows) else 0
    if cmd == "gates":
        found = videogates.run(plan, previous=a.previous, only=set(a.only.split(",")) if a.only else None)
        (out / "gates.json").write_text(json.dumps(found, ensure_ascii=False, indent=1) + "\n")
        (out / "gates.md").write_text(videogates.markdown(found, a.scenario.stem, fmt["id"]) + "\n")
        print(json.dumps(found, ensure_ascii=False, indent=1) if a.json else videogates.markdown(found, a.scenario.stem, fmt["id"]))
        log(f"gates: {took()}")
        return 1 if videogates.blocking(found) and not a.warn_only else 0
    if plan["fatal"]:
        sys.exit(f"design fails: {plan['fatal']}")
    if cmd == "storyboard":
        r = videopreprod.storyboard(plan, out, per_shot=a.frames, cell=size, chrome=a.chrome, clean=a.clean, overlays=not a.no_overlays)
        print(f"storyboard: {r['frames']} stills, contact sheet {r['contact_sheet']}\n  per-shot PNGs and storyboard.json in {r['dir']}")
        log(f"storyboard: {took()}")
        return 0
    r = videopreprod.animatic(plan, out, scratch=clips or None, chrome=a.chrome, hud=a.hud)
    print(f"animatic: {r['file']} ({r['duration']}s, {r['frames']} frames, {r['scratch_clips']} scratch clips)")
    log(f"animatic: {took()}")
    return 0


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] in COMMANDS:
        sys.exit(cli(sys.argv[1:]))
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("audio", type=Path)
    p.add_argument("timeline", type=Path, help="scene.py's <out>.timeline.json")
    p.add_argument("--sheet", type=Path)
    p.add_argument("--out", type=Path, help="default: <audio stem>.video next to the wav")
    p.add_argument("--scenario", type=Path, help="the scenario the audio came from: {pause} splits scenes, <!-- screen: ... --> directives drive the screen")
    p.add_argument("--design", type=Path, help="design file (default: <scenario>.design.json next to the scenario)")
    p.add_argument("--describe", action="store_true", help="write the design as a review document (<design stem>.md) and exit")
    p.add_argument("--only", help="render only these scenes (ids s01,s02 ...) and cut the audio to them; the design file may be `partial`")
    p.add_argument("--draft", action="store_true", help="draft profile: 640x360 at 15 fps, own cache entries, <stem>.draft.mp4")
    p.add_argument("--chrome", help="Chrome/headless-shell binary (or PERFORM_CHROME)")
    a = p.parse_args()
    v1 = json.loads(a.timeline.read_text())
    if a.describe:
        design_path = a.design or a.scenario.with_suffix(".design.json")
        tl = videoplan.timeline_v2(v1, audio=a.audio.name, duration=max(e["end"] for e in v1), sr=24000, breaks=scenario_marks(a.scenario)[0] if a.scenario else [])
        dest = design_path.with_name(design_path.name.replace(".design.json", ".scene.md"))
        dest.write_text(videodesign.describe(tl, json.loads(design_path.read_text())) + "\n")
        print(dest)
        return
    sr, samples = videoplan.read_wav(a.audio)
    duration = len(samples) / sr
    make(a.audio, v1, sr=sr, duration=duration, out=a.out or a.audio.with_suffix(".video"), sheet_path=a.sheet, chrome=a.chrome, scenario_src=a.scenario, design_path=a.design, only=a.only.split(",") if a.only else None, draft=a.draft)


if __name__ == "__main__":
    main()
