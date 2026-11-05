"""Pre-production: the script (+ design file) to storyboard stills and an animatic, before any audio or full render exists.

    prepare()     scenario + design -> estimated timeline -> timeline v2 -> sheet -> shots.json per scene (no audio, mouths closed)
    storyboard()  one still per shot (more with --frames), cards, a contact sheet, per-shot json
    animatic()    the stills sequenced on the timeline with subtitles and cards: a draft mp4 (scratch voice where takes exist)

World-agnostic: names of characters, sets and rigs come from the design file, video/layout.json (or the world's own) and the rigs.
See docs/PREPRODUCTION.md for the ladder and the gates; videogates.py / videocapability.py / videoretime.py are the checks.
"""

import hashlib
import json
import re
import subprocess
import tempfile
import time
import wave
from pathlib import Path
from typing import Any

import scenario
import videodesign
import videoestimate
import videoplan
import videostills
import videosubs

ROOT = Path(__file__).resolve().parent.parent / "video"
FORMATS = ROOT / "formats"


def load_format(spec: str | None) -> dict[str, Any]:
    """A format profile by id (video/formats/<id>.json) or by path (a world's own)."""
    spec = spec or "landscape-720"
    p = Path(spec)
    f = p if p.suffix == ".json" and p.exists() else FORMATS / f"{spec}.json"
    if not f.exists():
        msg = f"no format profile {spec!r}: have {', '.join(sorted(x.stem for x in FORMATS.glob('*.json')))}"
        raise FileNotFoundError(msg)
    return json.loads(f.read_text())


def heard(tl: dict[str, Any], scene: dict[str, Any], beats_: list[int], limit: int = 110) -> str:
    """The words (or sound effect) of a shot's beats, tags removed."""
    bl = videodesign.beats(tl, scene)
    out = []
    for b in beats_:
        if 1 <= b <= len(bl):
            e = tl["entries"][bl[b - 1]]
            out.append(f"{e['voice']}: {scenario.spoken(e['text'])}" if e.get("text") else f"sfx {e.get('sfx', '')}")
    text = " / ".join(out)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def prepare(
    src: Path, out: Path, *, design: Path | None = None, layout: Path | None = None, fmt: dict[str, Any] | None = None,
    known: dict[int, float] | None = None, pace: dict[str, float] | None = None, captions: bool = False,
    entries: list[dict[str, Any]] | None = None, size: tuple[int, int] | None = None, fps: int | None = None,
) -> dict[str, Any]:
    """Everything stages 1-3 need, from the script and the design alone.

    Returns {sc, entries, tl, sheet, report, groups, shots, design, layout, fmt, duration, fatal}. `entries` replaces the estimate
    (retime passes the real timeline). A design that raises (a missing rig, an ungrounded object) is returned as `fatal` with the message.
    """
    import video  # noqa: PLC0415  (video.py imports this module)

    fmt = fmt or load_format(None)
    sc = scenario.load(src)
    entries = entries if entries is not None else videoestimate.estimate(sc, pace=pace, known=known)
    breaks, cues = video.scenario_marks(src)
    duration = videoestimate.total(entries)
    tl = videoplan.timeline_v2(entries, audio="(estimated)", duration=duration, sr=24000, breaks=breaks, cues=cues)
    layout_d = json.loads((layout or video.LAYOUT).read_text())
    design_path = design or src.with_suffix(".design.json")
    design_d = json.loads(design_path.read_text()) if design_path.exists() else None
    report: dict[str, Any] = {}
    plan_out: dict[str, Any] = {"sc": sc, "entries": entries, "tl": tl, "design": design_d, "layout": layout_d, "fmt": fmt, "duration": duration, "report": report, "fatal": None, "sheet": None, "groups": [], "shots": {}}
    try:
        sheet = videodesign.emit_sheet(tl, layout_d, design_d, report) if design_d else videoplan.emit_sheet(tl, layout_d)
    except (ValueError, KeyError) as e:
        plan_out["fatal"] = f"{type(e).__name__}: {e.args[0] if e.args else e}"
        return plan_out
    if size:
        sheet["size"] = list(size)
    if fps:
        sheet["fps"] = fps
    segs = {g["title"]: g for g in videoplan.segment(tl, sheet)}
    if captions:
        for title, d in sheet["scenes"].items():
            g = segs[title]
            d["captions"] = videosubs.captions(tl["entries"], g["turns"], g["t0"], fmt["gates"].get("caption_chars_per_line", 42))
    only = [g["id"] for g in segs.values() if g["title"] in sheet["scenes"]]
    groups = videoplan.plan(tl, sheet, None, out / "scenes", ROOT / "assets", only, wav=(24000, []))
    plan_out |= {"sheet": sheet, "groups": groups, "shots": {g["id"]: json.loads((g["dir"] / "shots.json").read_text()) for g in groups}}
    return plan_out


def shot_spans(shots: dict[str, Any]) -> list[tuple[dict[str, Any], float, float]]:
    """[(shot, t0, t1)] of a resolved scene: a shot lasts until the next one starts; the last to the end of the scene."""
    lst = shots.get("shots") or [{"id": "1", "t0": 0.0, "camera": shots["camera"], "cast": [a["id"] for a in shots["actors"]]}]
    ends = [s["t0"] for s in lst[1:]] + [shots["duration"]]
    return [(s, s["t0"], e) for s, e in zip(lst, ends, strict=True)]


def _design_shot(plan: dict[str, Any], title: str, shot_id: str) -> dict[str, Any]:
    d = (plan["design"] or {}).get("scenes", {}).get(title, {})
    return next((s for s in d.get("shots", []) if s["id"] == shot_id), {})


def storyboard_frames(plan: dict[str, Any], per_shot: int = 1, overlays: bool = True) -> list[dict[str, Any]]:
    """The frames of the storyboard in film order: one (or `per_shot`) per shot, one per transition card, one per overlay's own state."""
    scenes = {s["title"]: s for s in plan["tl"]["scenes"]}
    items: list[dict[str, Any]] = []
    for g in plan["groups"]:
        shots = plan["shots"][g["id"]]
        title = shots["title"]
        report = plan["report"].get("shots", {}).get(title, {})
        for sh, t0, t1 in shot_spans(shots):
            dur = t1 - t0
            ds = _design_shot(plan, title, sh["id"])
            times = [t0 + min(dur * 0.5, 1.5)] if per_shot == 1 else [t0 + 0.1, t0 + dur * 0.5, max(t0, t1 - 0.1)][:per_shot]
            boxes = [{"n": k, "b": v} for k, v in report.get(sh["id"], {}).items()]
            focus = None
            if boxes:
                xs = [b["b"][0] for b in boxes] + [b["b"][0] + b["b"][2] for b in boxes]
                ys = [b["b"][1] for b in boxes] + [b["b"][1] + b["b"][3] for b in boxes]
                focus = [(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2]
            text = heard(plan["tl"], scenes[title], sh.get("beats", [])) if sh.get("beats") else ""
            for k, t in enumerate(times):
                tag = f"{sh['id']} {sh.get('frame', '')} {dur:.1f}s" + (f" ({k + 1}/{len(times)})" if len(times) > 1 else "")
                items.append({"scene": g["id"], "title": title, "shot": sh["id"], "kind": "shot", "t": round(t, 3), "t0": round(t0, 3), "t1": round(t1, 3), "tag": tag, "line": text,
                              "boxes": boxes, "crop": focus, "frame": sh.get("frame", ""), "cast": [c["id"] if isinstance(c, dict) else c for c in sh.get("cast", [])],
                              "subjects": ds.get("subjects", []), "intent": ds.get("intent", "")})
            if overlays:
                for i, o in enumerate(sh.get("overlays", [])):
                    ot = min(max(o["t0"] + 0.35, t0), t1 - 0.05)
                    main_t = next((x["t"] for x in items if x["scene"] == g["id"] and x["shot"] == sh["id"] and x["kind"] == "shot"), t0)
                    if o["t0"] <= main_t < o["t1"] or any(abs(ot - x["t"]) < 0.3 for x in items if x["scene"] == g["id"] and x["shot"] == sh["id"]):
                        continue  # already on a still of this shot
                    items.append({"scene": g["id"], "title": title, "shot": sh["id"], "kind": "overlay", "t": round(ot, 3), "t0": round(t0, 3), "t1": round(t1, 3), "tag": f"{sh['id']}+{o.get('kind', 'ov')}", "line": text,
                                  "boxes": [], "crop": focus, "frame": sh.get("frame", ""), "cast": [], "subjects": [], "intent": f"overlay {o.get('kind')} {o['t0']:.1f}-{o['t1']:.1f}s", "n": i})
        for tr in shots.get("transitions", []):
            ct = min(tr["t1"] - 0.05, tr["t0"] + max(tr.get("fade", 0.4), 0.45)) if tr["type"] == "time_card" else tr["t0"] + 0.02
            items.append({"scene": g["id"], "title": title, "shot": "card", "kind": "card", "t": round(max(0.0, ct), 3), "t0": tr["t0"], "t1": tr["t1"], "tag": f"card «{tr.get('text', '')}» {tr['type']}", "line": "",
                          "boxes": [], "crop": None, "frame": "card", "cast": [], "subjects": [], "intent": ""})
    return items


def hud_of(fmt: dict[str, Any]) -> dict[str, Any]:
    return {"zones": fmt.get("zones"), "subtitle": fmt.get("subtitle"), "crop": fmt.get("crop")}


def storyboard(plan: dict[str, Any], out: Path, *, per_shot: int = 1, cell: tuple[int, int] = (960, 540), chrome: str | None = None, clean: bool = False, overlays: bool = True) -> dict[str, Any]:
    """Stills for every shot, cards and overlay states + a contact sheet + storyboard.json. Returns {frames, seconds, cpu_seconds}."""
    t_wall = time.time()
    d = out / "storyboard"
    d.mkdir(parents=True, exist_ok=True)
    for old in d.glob("*.png"):
        old.unlink()
    items = storyboard_frames(plan, per_shot, overlays)
    for i, it in enumerate(items):
        it["png"] = f"{it['scene']}_{it['shot']}" + ("" if it["kind"] == "shot" and not re.search(r"\(\d/\d\)", it["tag"]) else f"_{i:02d}") + ".png"
        if it["kind"] != "shot":
            it["png"] = f"{it['scene']}_{it['shot']}_{it['kind']}{i:02d}.png"
    jobs = []
    for g in plan["groups"]:
        mine = [it for it in items if it["scene"] == g["id"]]
        mouth = {}
        for p in g["dir"].glob("mouth_*.json"):
            mouth[p.stem[6:]] = json.loads(p.read_text())
        jobs.append({"shots": plan["shots"][g["id"]], "mouth": mouth, "outs": [d / it["png"] for it in mine],
                     "frames": [{"t": it["t"], "tag": it["tag"], "line": videostills.escape(it["line"]), "boxes": it["boxes"], "crop": it["crop"]} for it in mine]})
    videostills.render_scenes(jobs, cell, None if clean else hud_of(plan["fmt"]), chrome)
    sheet = contact_sheet(items, d, d / "contact_sheet.png", chrome)
    meta = [{k: v for k, v in it.items() if k not in {"boxes", "crop"}} | {"subject_boxes": {b["n"]: b["b"] for b in it["boxes"]}} for it in items]
    (d / "storyboard.json").write_text(json.dumps({"format": plan["fmt"]["id"], "duration_est": round(plan["duration"], 1), "frames": meta}, ensure_ascii=False, indent=1) + "\n")
    return {"frames": len(items), "dir": d, "contact_sheet": sheet, "seconds": round(time.time() - t_wall, 1), "items": items}


def contact_sheet(items: list[dict[str, Any]], d: Path, dest: Path, chrome: str | None = None, cols: int = 4, thumb: tuple[int, int] = (480, 270)) -> Path:
    """All stills in film order on one image, each labelled with shot id, time and the line; one sheet per ~24 stills when the film is long."""
    w, h = thumb
    label_h = 46
    per = 24
    parts = []
    for n in range(0, len(items), per):
        chunk = items[n : n + per]
        cells = "".join(
            f'<div class="k"><img src="{(d / it["png"]).as_uri()}" width="{w}" height="{h}"><div class="l"><b>{videostills.escape(it["tag"])}</b> · {it["t"]:.1f}s · {videostills.escape(it["title"][:24])}<br>{videostills.escape(it["line"][:70])}</div></div>'
            for it in chunk
        )
        rows = -(-len(chunk) // cols)
        html = (f'<!doctype html><meta charset="utf-8"><style>body{{margin:0;background:#111;font:12px Helvetica,Arial,sans-serif;color:#eee}}#g{{display:grid;grid-template-columns:repeat({cols},{w + 8}px);gap:0}}'
                f'.k{{width:{w + 8}px;height:{h + label_h + 6}px;padding:3px 4px;box-sizing:border-box}}.l{{height:{label_h}px;overflow:hidden;line-height:1.25;padding-top:3px}}img{{display:block}}</style><div id="g">{cells}</div>')
        dst = dest if n == 0 and len(items) <= per else dest.with_name(f"{dest.stem}_{n // per + 1}.png")
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "sheet.html"
            page.write_text(html)
            png = Path(tmp) / "sheet.png"
            videostills.shoot_url(page.as_uri(), (cols * (w + 8), rows * (h + label_h + 6)), png, chrome)
            dst.write_bytes(png.read_bytes())
        parts.append(dst)
    return parts[0]


# ---- animatic ----

def sample_times(shots: dict[str, Any], push_fps: float = 2.0, anim_fps: float = 6.0, min_gap: float = 0.1) -> list[float]:
    """Times of the animatic's frames in a scene: every event that changes the picture, and a sample rate inside moves (push-ins, fades, card slides)."""
    ev = {0.0}
    moving: list[tuple[float, float, float]] = []  # (t0, t1, fps)
    for sh, t0, t1 in shot_spans(shots):
        ev.add(t0)
        if sh.get("camera", {}).get("push_to"):
            moving.append((t0, t1, push_fps))
        for o in sh.get("overlays", []):
            ev |= {o["t0"], min(o["t1"], t1)}
            ev |= {s["t0"] for s in o.get("states", [])}
            if "grow" in o:
                moving.append((o["grow"]["t0"], o["grow"]["t0"] + o["grow"]["dur"], anim_fps))
            moving.append((o["t0"], o["t0"] + 0.2, anim_fps))
        if "slide" in sh.get("inset", {}):
            moving.append((sh["inset"]["slide"]["t0"], sh["inset"]["slide"]["t0"] + sh["inset"]["slide"]["dur"], anim_fps))
    for tr in shots.get("transitions", []):
        moving.append((tr["t0"], tr["t1"], anim_fps))
        ev |= {tr["t0"], tr["t1"]}
    for tr in shots.get("tracks", []):
        ev |= {k["t"] for k in tr["keys"] if k["t"] < shots["duration"] and tr["channel"] != "expr"}
    for c in shots.get("captions", []):
        ev |= {c["t0"], c["t1"]}
    for a, b, f in moving:
        t = a
        while t < min(b, shots["duration"]):
            ev.add(round(t, 3))
            t += 1 / f
    pts = sorted(t for t in ev if 0 <= t < shots["duration"])
    out: list[float] = []
    for t in pts:
        if not out or t - out[-1] >= min_gap:
            out.append(round(t, 3))
    return out


def animatic(plan: dict[str, Any], out: Path, *, cell: tuple[int, int] = (640, 360), fps: int = 15, scratch: dict[int, Path] | None = None, chrome: str | None = None, hud: bool = False) -> dict[str, Any]:
    """Draft mp4 of the whole film from the stills: events on the estimated timeline, subtitles, cards; scratch clips under it where given."""
    t_wall = time.time()
    d = out / "animatic"
    d.mkdir(parents=True, exist_ok=True)
    frames_dir = d / "frames"
    if frames_dir.exists():
        for f in frames_dir.glob("*.png"):
            f.unlink()
    frames_dir.mkdir(exist_ok=True)
    jobs, seq = [], []  # seq: (png, duration)
    for g in plan["groups"]:
        shots = plan["shots"][g["id"]]
        times = sample_times(shots)
        outs = [frames_dir / f"{g['id']}_{i:04d}.png" for i in range(len(times))]
        mouth = {p.stem[6:]: json.loads(p.read_text()) for p in g["dir"].glob("mouth_*.json")}
        jobs.append({"shots": shots, "mouth": mouth, "outs": outs, "frames": [{"t": t} for t in times]})
        ends = [*times[1:], shots["duration"]]
        seq += [(o, round(e - t, 3)) for o, t, e in zip(outs, times, ends, strict=True)]
    videostills.render_scenes(jobs, cell, hud_of(plan["fmt"]) if hud else None, chrome)
    t_stills = time.time() - t_wall
    lst = d / "frames.ffconcat"
    lst.write_text("ffconcat version 1.0\n" + "".join(f"file 'frames/{p.name}'\nduration {max(dur, 0.04)}\n" for p, dur in seq) + f"file 'frames/{seq[-1][0].name}'\n")
    silent = d / "animatic.silent.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-vf", f"fps={fps},scale={cell[0]}:{cell[1]},format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", str(silent)], check=True)
    dest = d / "animatic.mp4"
    used = 0
    if scratch:
        used = mix_scratch(plan["entries"], scratch, silent, dest, plan["duration"])
    else:
        silent.replace(dest)
    return {"file": dest, "frames": len(seq), "seconds": round(time.time() - t_wall, 1), "stills_seconds": round(t_stills, 1), "scratch_clips": used, "duration": round(plan["duration"], 1)}


def mix_scratch(entries: list[dict[str, Any]], clips: dict[int, Path], video_in: Path, dest: Path, duration: float) -> int:
    """Mux a scratch track under the animatic: each turn that has a clip is placed at its start, the rest stays silent."""
    placed = [(e, clips[e["turn"]]) for e in entries if "turn" in e and e["turn"] in clips]
    if not placed:
        video_in.replace(dest)
        return 0
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(video_in)]
    for _, c in placed:
        cmd += ["-i", str(c)]
    flt = "".join(f"[{i + 1}:a]aformat=sample_rates=24000:channel_layouts=mono,adelay={round(e['start'] * 1000)}:all=1[a{i}];" for i, (e, _) in enumerate(placed))
    flt += "".join(f"[a{i}]" for i in range(len(placed))) + f"amix=inputs={len(placed)}:normalize=0:dropout_transition=0,apad=whole_dur={duration:.2f}[m]"
    subprocess.run([*cmd, "-filter_complex", flt, "-map", "0:v", "-map", "[m]", "-c:v", "copy", "-c:a", "aac", "-b:a", "96k", "-shortest", str(dest)], check=True)
    return len(placed)


def scratch_from(source: Path, sc: scenario.Scenario, work: Path) -> tuple[dict[int, float], dict[int, Path]]:
    """Scratch voice from what exists: a past render (<name>.wav + <name>.timeline.json) or a takes dir with index.jsonl (scene.py writes it).

    Returns ({item number: real seconds}, {item number: clip wav}) matched to this script by (voice, text), so edited lines stay estimates.
    """
    work.mkdir(parents=True, exist_ok=True)
    known: dict[int, float] = {}
    clips: dict[int, Path] = {}
    if source.is_dir():
        idx = source / "index.jsonl"
        have: dict[tuple[str, str, bool], dict[str, Any]] = {}
        if idx.exists():
            for line in idx.read_text().splitlines():
                r = json.loads(line)
                have[(r["voice"], _norm(r["text"]), bool(r.get("phone")))] = r
        for n, it in enumerate(sc.items, 1):
            if isinstance(it, scenario.Turn) and (r := have.get((it.voice, _norm(it.text), it.phone))) and (source / f"{r['key']}.wav").exists():
                known[n], clips[n] = r["seconds"], source / f"{r['key']}.wav"
        return known, clips
    wav = source.with_suffix(".wav")
    tl_file = source.with_suffix(".timeline.json")
    real = json.loads(tl_file.read_text())
    match = videoestimate.from_render(real, sc)
    by_key: dict[tuple[str, str], dict[str, Any]] = {(e["voice"], _norm(e["text"])): e for e in real if "turn" in e}
    with wave.open(str(wav), "rb") as w:
        sr, ch, width = w.getframerate(), w.getnchannels(), w.getsampwidth()
        for n, it in enumerate(sc.items, 1):
            if not isinstance(it, scenario.Turn) or n not in match:
                continue
            e = by_key[(it.voice, _norm(it.text))]
            w.setpos(int(e["start"] * sr))
            raw = w.readframes(int((e["end"] - e["start"]) * sr))
            clip = work / f"clip_{n:03d}.wav"
            with wave.open(str(clip), "wb") as o:
                o.setnchannels(ch)
                o.setsampwidth(width)
                o.setframerate(sr)
                o.writeframes(raw)
            clips[n] = clip
    known = {n: s for n, s in match.items() if n in clips}
    return known, clips


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def digest(obj: Any) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
