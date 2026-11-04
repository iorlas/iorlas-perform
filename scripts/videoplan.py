"""Video plan: scene.py's timeline -> timeline v2 -> scene sheet -> one engine-neutral shots.json per scene.

Pure Python, stdlib only, no engine code: everything here sits upstream of `shots.json`.
video.py renders the shots (Node adapter) and joins them.

timeline v2 (`timeline/2`) is timeline v1 (one entry per turn, sfx and bed) plus what a renderer needs
to cut scenes without guessing: the audio file, its length, and the scenes in order.

A scene sheet (`scene-sheet/1`) is the acting layer: who is on stage per scene and what they do on which turn.
`emit_sheet` writes a default one from video/layout.json (cast -> rig, props, camera, pose pairing);
the author then edits cues by hand, and a sheet that already exists is never overwritten.
"""

import json
import math
import struct
import wave
from pathlib import Path
from typing import Any

SHEET = "scene-sheet/1"
TIMELINE = "timeline/2"
SHOTS = "shots/1"


def timeline_v2(v1: list[dict[str, Any]], *, audio: str, duration: float, sr: int) -> dict[str, Any]:
    """Wrap scene.py's timeline: add the audio name, its length and the scenes in order."""
    scenes: list[dict[str, Any]] = []
    for e in v1:
        if "turn" not in e:
            continue
        title = e.get("scene") or "(no scene)"
        if not scenes or scenes[-1]["title"] != title:
            scenes.append({"title": title, "ambience": e.get("ambience"), "turns": []})
        scenes[-1]["turns"].append(e["turn"])
    return {"schema": TIMELINE, "audio": audio, "sr": sr, "duration": round(duration, 3), "scenes": scenes, "entries": v1}


def emit_sheet(tl: dict[str, Any], layout: dict[str, Any]) -> dict[str, Any]:
    """Default scene sheet: props always on stage, cast members on stage in scenes where their voice speaks."""
    cast = layout.get("cast", {})
    voices_by_scene = {s["title"]: {e["voice"] for e in tl["entries"] if e.get("turn") in s["turns"]} for s in tl["scenes"]}
    scenes: dict[str, Any] = {}
    for title, voices in voices_by_scene.items():
        actors = [{k: v for k, v in p.items() if k != "state"} for p in layout.get("props", [])]
        cues: list[dict[str, Any]] = [
            {"at": 0, "actor": p["id"], "channel": "state", "value": p.get("state", "idle")} for p in layout.get("props", [])
        ]
        seen: set[str] = set()
        for voice in sorted(voices):
            c = cast.get(voice)
            if not c or c["id"] in seen:
                continue
            seen.add(c["id"])
            actors.append({k: v for k, v in c.items() if k != "expr"})
            cues.append({"at": 0, "actor": c["id"], "channel": "expr", "blend": 0.25, "value": c.get("expr", "tired_neutral")})
        scenes[title] = {"actors": sorted(actors, key=lambda a: a.get("layer", 0)), "cues": cues}
    return {
        "schema": SHEET,
        "fps": layout.get("fps", 30),
        "size": layout.get("size", [1280, 720]),
        "camera": layout["camera"],
        "background": layout.get("background", "#26344f"),
        "cast": {v: {"actor": c["id"]} for v, c in cast.items()},
        "scenes": scenes,
    }


def segment(tl: dict[str, Any], sheet: dict[str, Any]) -> list[dict[str, Any]]:
    """Cut the audio clock into contiguous scenes on whole frames: [{id,title,turns,t0,t1,frames}].

    A scene starts `lead` before its first turn; the previous scene runs until then, the first starts at 0
    and the last runs to the end of the audio, so the video covers every second of the mix.
    """
    fps, lead = sheet.get("fps", 30), sheet.get("lead", 0.3)
    by_n = {e["turn"]: e for e in tl["entries"] if "turn" in e}
    groups = [
        {"id": f"s{i + 1:02d}", "title": s["title"], "turns": [by_n[n] for n in s["turns"]]} for i, s in enumerate(tl["scenes"])
    ]
    total = max(1, math.ceil(tl["duration"] * fps))
    edges = [0] + [min(total, max(0, round((min(t["start"] for t in g["turns"]) - lead) * fps))) for g in groups[1:]] + [total]
    for i, g in enumerate(groups):
        g["f0"], g["f1"] = edges[i], max(edges[i], edges[i + 1])
        g["t0"], g["frames"] = g["f0"] / fps, g["f1"] - g["f0"]
        g["t1"], g["duration"] = g["f1"] / fps, g["frames"] / fps
    return groups


def read_wav(path: Path) -> tuple[int, list[float]]:
    """PCM16 wav -> (sample rate, mono samples in -1..1). Other formats are refused, not guessed."""
    with wave.open(str(path), "rb") as w:
        if w.getsampwidth() != 2:
            msg = f"{path}: wav must be PCM16 (scene.py writes PCM16), got {w.getsampwidth() * 8} bit"
            raise ValueError(msg)
        ch, sr, raw = w.getnchannels(), w.getframerate(), w.readframes(w.getnframes())
    ints = struct.unpack(f"<{len(raw) // 2}h", raw)
    return sr, [sum(ints[i : i + ch]) / ch / 32768 for i in range(0, len(ints) - ch + 1, ch)]


def envelope(wav: tuple[int, list[float]], fps: int, t0: float, duration: float, turns: list[tuple[float, float]]) -> dict[str, Any]:
    """Mouth opening per video frame from audio RMS, gated to the actor's own turns (scene-relative seconds).

    Normalised so the 95th percentile of voiced frames is 0.9, dilated one frame so syllable gaps do not flutter,
    below 0.08 -> closed. Deterministic: same audio, same numbers.
    """
    sr, samples = wav
    n, win = round(duration * fps), sr / fps
    rms = []
    for f in range(n):
        a, b = int((t0 * fps + f) * win), min(len(samples), int((t0 * fps + f + 1) * win))
        rms.append(math.sqrt(sum(x * x for x in samples[a:b]) / (b - a)) if b > a >= 0 else 0.0)
    gated = [v if any(s - 0.05 <= f / fps < e + 0.05 for s, e in turns) else 0.0 for f, v in enumerate(rms)]
    voiced = sorted(v for v in gated if v > 0)
    ref = voiced[int(len(voiced) * 0.95)] if voiced else 1.0
    raw = [min(0.9, v / ref * 0.9) for v in gated]
    out = [max(v, 0.6 * (raw[i - 1] if i else 0), 0.6 * (raw[i + 1] if i + 1 < n else 0)) for i, v in enumerate(raw)]
    return {"kind": "mouth_open", "fps": fps, "samples": [0 if v < 0.08 else round(v, 3) for v in out]}


def resolve_scene(group: dict[str, Any], sheet: dict[str, Any], wav: tuple[int, list[float]]) -> dict[str, Any]:
    """One scene's shots (engine-neutral) and mouth envelopes, from its sheet entry. Cue times are scene-relative."""
    title, fps = group["title"], sheet.get("fps", 30)
    scenes = sheet.get("scenes", {})
    if (d := scenes.get(title, scenes.get("*"))) is None:
        msg = f'scene sheet has no entry for scene "{title}" (and no "*")'
        raise KeyError(msg)

    def rel(t: float) -> float:
        return round(t - group["t0"], 3)

    def turn_start(n: int) -> float:
        for t in group["turns"]:
            if t["turn"] == n:
                return rel(t["start"])
        msg = f'cue refers to turn {n}, not in scene "{title}"'
        raise KeyError(msg)

    tracks: list[dict[str, Any]] = []
    for c in d.get("cues", []):
        t = c["at"] if "at" in c else turn_start(c["turn"]) + c.get("offset", 0)
        tr = next((x for x in tracks if x["actor"] == c["actor"] and x["channel"] == c["channel"]), None)
        if tr is None:
            tr = {"actor": c["actor"], "channel": c["channel"], **({"blend": c["blend"]} if "blend" in c else {}), "keys": []}
            tracks.append(tr)
        tr["keys"].append({"t": round(t, 3)} | {k: v for k, v in c.items() if k not in {"at", "turn", "offset", "actor", "channel", "blend"}})
    for tr in tracks:
        tr["keys"].sort(key=lambda k: k["t"])
        if tr["keys"][0]["t"] > 0:
            tr["keys"].insert(0, {**tr["keys"][0], "t": 0})

    actors, mouth = [dict(a) for a in d["actors"]], {}
    for a in actors:
        voices = [v for v, c in sheet.get("cast", {}).items() if c["actor"] == a["id"]]
        if a.get("kind") == "object" or not voices:
            continue
        turns = [(rel(t["start"]), rel(t["end"])) for t in group["turns"] if t["voice"] in voices]
        mouth[a["id"]] = envelope(wav, fps, group["t0"], group["duration"], turns)
        a["mouth"] = f"mouth_{a['id']}.json"
    shots = {
        "schema": SHOTS,
        "scene": group["id"],
        "title": title,
        "fps": fps,
        "size": sheet.get("size", [1280, 720]),
        "duration": group["duration"],
        "camera": d.get("camera", sheet["camera"]),
        "background": d.get("background", sheet.get("background", "#26344f")),
        "actors": actors,
        "tracks": tracks,
        **({"captions": d["captions"]} if "captions" in d else {}),
    }
    return {"shots": shots, "mouth": mouth}


def write_scene(out: Path, scene: dict[str, Any]) -> Path:
    """<out>/<id>/shots.json and mouth_<actor>.json: the whole contract with the renderer."""
    d = out / scene["shots"]["scene"]
    d.mkdir(parents=True, exist_ok=True)
    (d / "shots.json").write_text(json.dumps(scene["shots"], ensure_ascii=False, indent=1))
    for actor, m in scene["mouth"].items():
        (d / f"mouth_{actor}.json").write_text(json.dumps(m))
    return d


def plan(tl: dict[str, Any], sheet: dict[str, Any], audio: Path, out: Path) -> list[dict[str, Any]]:
    """Every scene of the timeline resolved and written under `out`; returns the groups with their `dir`."""
    wav = read_wav(audio)
    groups = segment(tl, sheet)
    for g in groups:
        g["dir"] = write_scene(out, resolve_scene(g, sheet, wav))
    return groups
