"""Scenario design file -> scene sheet (scene-sheet/2): sets, shots per beat, transitions, per-scenario props and screen cues.

The design file sits next to the scenario (`night_shift.md` -> `night_shift.design.json`, schema `scene-design/1`) and is the
author's input; this module turns it plus the timeline into the sheet that videoplan.py resolves to shots.json.

    {"schema": "scene-design/1", "offscreen": ["narrator"],
     "cast": {"vadik": {}, "praporshchik": {"offset": [0, -134]}},        # voice -> overrides of video/layout.json's cast entry
     "sets": {"setA_office_dusk": {"props": [{"id": "clock", "at": [-300, -300], "text": "18:00"}]}},
     "props": {"monitor": {...}},                                        # overrides of video/placeholders.json
     "screens": {"deploy": {"kind": "bar", ...}},                         # named screen contents
     "scenes": {"<## heading>": {"set": "...", "transition_out": {"type": "time_card", "text": "СБ 03:00"},
        "shots": [{"id": "1.1", "beats": [1], "frame": "wide", "focus": "vadik", "cast": ["vadik"], "props": [], "push_in": 0.8,
                   "inset": {"set": "...", "cast": [...], "rect": [x, y, w, h], "frame": "medium", "focus": "palych"}}],
        "cues": [{"beat": 2, "actor": "vadik", "expr": "wince"}, {"beat": 2, "offset": 1.0, "target": "monitor", "screen": "deploy"}]}}}

A beat is a turn or a sound effect of the scene, counted from 1 in time order. A shot starts a little before its first beat;
the first shot of a scene starts with the scene. Shot types are the keys of layout.json `frames`: wide, medium, close, insert, inset.
"""

import json
from pathlib import Path
from typing import Any

import videoplan

DESIGN = "scene-design/1"
SHEET = "scene-sheet/2"
ROOT = Path(__file__).resolve().parent.parent / "video"
PLACEHOLDERS = ROOT / "placeholders.json"


def beats(tl: dict[str, Any], scene: dict[str, Any]) -> list[int]:
    """Indexes into tl["entries"] of a scene's turns and sound effects, in time order (beat n = element n-1)."""
    turns = set(scene["turns"])
    mine = [i for i, e in enumerate(tl["entries"]) if e.get("turn") in turns]
    lo, hi = tl["entries"][mine[0]]["start"], tl["entries"][mine[-1]]["end"]
    sfx = [i for i, e in enumerate(tl["entries"]) if "sfx" in e and lo <= e["start"] <= hi]
    return sorted([*mine, *sfx], key=lambda i: tl["entries"][i]["start"])


def _camera(
    frame: str, focus_xy: tuple[float, float], layout: dict[str, Any], push_in: float | None, override: dict[str, Any] | None = None, aspect: float = 16 / 9
) -> dict[str, Any]:
    spec = {**layout["frames"][frame], **(override or {})}
    w = spec["w"]
    cx, cy = focus_xy[0] + spec.get("dx", 0), spec["cy"] if "cy" in spec else focus_xy[1] + spec.get("dy", 0)
    h = round(w / aspect)
    vb = [round(cx - w / 2), round(cy - h / 2), w, h]
    cam: dict[str, Any] = {"viewBox": vb}
    if push_in:
        pw = round(w * push_in)
        ph = round(h * push_in)
        cam["push_to"] = [round(cx - pw / 2), round(cy - ph / 2), pw, ph]
    return cam


def emit_sheet(tl: dict[str, Any], layout: dict[str, Any], design: dict[str, Any]) -> dict[str, Any]:
    """Scene sheet from a design file. Voices on screen get their own rig (layout cast, overridden by the design); anything
    unlisted that is not off screen is an error."""
    if design.get("schema") != DESIGN:
        msg = f"design file schema must be {DESIGN}"
        raise ValueError(msg)
    placeholders = json.loads(PLACEHOLDERS.read_text())
    off = set(design.get("offscreen", layout.get("offscreen", ["narrator"])))
    cast = {v: {**layout["cast"][v], **ov} for v, ov in design.get("cast", {}).items() if v in layout["cast"]}
    missing = sorted({e["voice"] for e in tl["entries"] if "turn" in e} - set(cast) - off)
    if missing or (bad := sorted(set(design.get("cast", {})) - set(layout["cast"]))):
        msg = f"voices with no rig in video/layout.json (add a cast entry, or list under offscreen): {', '.join(missing or bad)}"
        raise ValueError(msg)
    by_id = {c["id"]: c for c in cast.values()}
    voice_of = {c["id"]: v for v, c in cast.items()}
    pos = {i: c.get("offset", [0, 0]) for i, c in by_id.items()}
    scenes: dict[str, Any] = {}
    for si, s in enumerate(tl["scenes"]):
        d = design["scenes"].get(s["title"])
        if d is None:
            msg = f'design file has no scene "{s["title"]}"'
            raise KeyError(msg)
        bl = beats(tl, s)
        def at(n: int, off: float = 0.0, b: list[int] = bl) -> dict[str, Any]:
            return {"entry": b[n - 1], **({"offset": off} if off else {})}

        used: dict[str, dict[str, Any]] = {}
        shots = []
        for sh in d["shots"]:
            first = sh["beats"][0]
            if not 1 <= first <= len(bl):
                msg = f'scene "{s["title"]}" shot {sh["id"]}: beat {first} does not exist (scene has {len(bl)} beats)'
                raise ValueError(msg)
            ids = [c if isinstance(c, str) else c["id"] for c in sh.get("cast", [])]
            focus = sh.get("focus") or (ids[0] if ids else None)
            fxy = tuple(next((c["offset"] for c in sh["cast"] if not isinstance(c, str) and c["id"] == focus and "offset" in c), pos.get(focus, [0, 0]))) if focus else (0, 0)
            if "at_xy" in sh:
                fxy = tuple(sh["at_xy"])
            out = {k: v for k, v in sh.items() if k not in {"beats", "frame", "focus", "push_in", "at_xy", "camera"}}
            out |= {"at": at(first), "frame": sh["frame"], "set": sh.get("set", d["set"]), "beats": sh["beats"], "camera": _camera(sh["frame"], fxy, layout, sh.get("push_in"), sh.get("camera"))}
            out["props"] = sh.get("props", [])
            if "inset" in sh:
                ins = sh["inset"]
                ifocus = ins.get("focus") or ins["cast"][0]
                ixy = tuple(next((c["offset"] for c in ins["cast"] if not isinstance(c, str) and c["id"] == ifocus and "offset" in c), pos.get(ifocus, [0, 0])))
                out["inset"] = {**{k: v for k, v in ins.items() if k not in {"frame", "focus"}}, "camera": _camera(ins.get("frame", "medium"), ixy, layout, None, ins.get("camera"), ins["rect"][2] * 16 / (ins["rect"][3] * 9))["viewBox"]}
                ids += [c if isinstance(c, str) else c["id"] for c in ins["cast"]]
            for i in ids:
                used.setdefault(i, {k: v for k, v in by_id[i].items() if k not in {"expr", "expr_map"}})
            shots.append(out)
        cues: list[dict[str, Any]] = []
        for i in used:
            c = by_id[i]
            cues.append({"at": 0, "actor": i, "channel": "expr", "blend": 0.25, "value": c.get("expr", "neutral_anxious")})
            for n in s["turns"]:
                e = next(x for x in tl["entries"] if x.get("turn") == n)
                if e["voice"] == voice_of[i] and (x := videoplan._pick(c.get("expr_map", {}), videoplan._tags(e["text"]))):  # noqa: SLF001
                    cues.append({"turn": n, "actor": i, "channel": "expr", "value": x})
        for c in d.get("cues", []):
            anchor = at(c["beat"], c.get("offset", 0.0))
            if "expr" in c:
                cues.append({**anchor, "actor": c["actor"], "channel": "expr", "value": c["expr"]})
            if "screen" in c:
                cues.append({**anchor, "actor": c["target"], "channel": "screen", "value": c["screen"]})
            if "text" in c:
                cues.append({**anchor, "actor": c["target"], "channel": "text", "value": c["text"]})
        nxt = tl["scenes"][si + 1]["title"] if si + 1 < len(tl["scenes"]) else None
        scenes[s["title"]] = {
            "set": d["set"], "actors": sorted(used.values(), key=lambda a: a.get("layer", 0)), "cues": cues, "shots": shots,
            **({"transition_out": d["transition_out"]} if "transition_out" in d and nxt else {}),
            **({"transition_in": design["scenes"][tl["scenes"][si - 1]["title"]]["transition_out"]} if si and "transition_out" in design["scenes"].get(tl["scenes"][si - 1]["title"], {}) else {}),
        }
    sets = {k: {**placeholders["sets"].get(k, {}), **v} for k, v in {**{k: {} for k in placeholders["sets"]}, **design.get("sets", {})}.items() if k in {x["set"] for x in scenes.values()} | {sh["inset"]["set"] for x in scenes.values() for sh in x["shots"] if "inset" in sh}}
    props = {k: {**placeholders["props"].get(k, {}), **v} for k, v in {**{k: {} for k in placeholders["props"]}, **design.get("props", {})}.items()}
    return {
        "schema": SHEET,
        "fps": layout.get("fps", 30),
        "size": layout.get("size", [1280, 720]),
        "camera": layout["camera"],
        "background": layout.get("background", "#26344f"),
        "cast": {v: {"actor": c["id"]} for v, c in cast.items()},
        "sets": sets,
        "props": props,
        "screens": design.get("screens", {}),
        "scenes": scenes,
    }
