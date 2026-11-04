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
import videoscene

DESIGN = "scene-design/2"
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


def _frame_has(shot: dict[str, Any], solved: dict[str, dict[str, Any]], oid: str) -> bool:
    """The object, in the shot's set, lies inside the shot's starting camera."""
    o = solved.get(shot["set"], {}).get(oid)
    x, y, w, h = shot["camera"]["viewBox"]
    return bool(o) and x <= o["at"][0] and o["at"][0] + o["w"] <= x + w and y <= o["top"] and o["bottom"] <= y + h


def emit_sheet(tl: dict[str, Any], layout: dict[str, Any], design: dict[str, Any]) -> dict[str, Any]:
    """Scene sheet from a design file. Voices on screen get their own rig (layout cast, overridden by the design); anything
    unlisted that is not off screen is an error. Positions come from videoscene (relations), never from pixels."""
    if design.get("schema") != DESIGN:
        msg = f"design file schema must be {DESIGN}"
        raise ValueError(msg)
    placeholders = json.loads(PLACEHOLDERS.read_text())
    stage = design["stage"]
    off = set(design.get("offscreen", layout.get("offscreen", ["narrator"])))
    cast = {v: {**layout["cast"][v], **ov} for v, ov in design.get("cast", {}).items() if v in layout["cast"]}
    missing = sorted({e["voice"] for e in tl["entries"] if "turn" in e} - set(cast) - off)
    if missing or (bad := sorted(set(design.get("cast", {})) - set(layout["cast"]))):
        msg = f"voices with no rig in video/layout.json (add a cast entry, or list under offscreen): {', '.join(missing or bad)}"
        raise ValueError(msg)
    by_id = {c["id"]: c for c in cast.values()}
    voice_of = {c["id"]: v for v, c in cast.items()}
    merged = {n: videoscene.merge_set(design["sets"], n) for n in design["sets"]}
    solved = {n: videoscene.solve_objects(m["objects"], stage) for n, m in merged.items()}
    raw = {n: {o["id"]: o for o in m["objects"]} for n, m in merged.items()}

    script = " ".join((e.get("text") or e.get("sfx") or "").casefold() for e in tl["entries"])  # words and sound effects
    for n, m in merged.items():
        for o in m["objects"]:  # grounding: every object cites the script or says it is invented
            src = o.get("from")
            if not src:
                msg = f'set {n}: object "{o["id"]}" has no "from": cite the script («сверчок за окном») or write "invented"'
                raise ValueError(msg)
            if src != "invented" and src.casefold() not in script:
                msg = f'set {n}: object "{o["id"]}" cites «{src}», which is not in the script'
                raise ValueError(msg)
            if o.get("side") == "outside":  # things outside are seen through a window: inside its frame, never on the inner sill
                win = [w for w in solved[n].values() if str(w.get("kind", "")).startswith("window")]
                me = solved[n][o["id"]]
                if o.get("place", {}).get("on") not in {w["id"] for w in win} or not any(w["at"][0] <= me["at"][0] and me["at"][0] + me["w"] <= w["at"][0] + w["w"] and w["top"] <= me["top"] and me["bottom"] <= w["bottom"] for w in win):
                    msg = f'set {n}: "{o["id"]}" is outside but not inside a window frame, so the viewer could not see it'
                    raise ValueError(msg)

    for n, st in design["sets"].items():  # sounds: heard, never drawn (a cricket outside at night); they cite the script too
        for snd in st.get("sounds", []):
            if snd.get("from", "").casefold() not in script or not snd.get("from"):
                msg = f'set {n}: sound "{snd["id"]}" must cite the script in "from"'
                raise ValueError(msg)

    def stand(set_name: str, actor: str) -> dict[str, Any]:
        spec = merged[set_name]["characters"].get(actor)
        if spec is None:
            msg = f'character "{actor}" has no place in set "{set_name}" (sets.{set_name}.characters)'
            raise ValueError(msg)
        return {**spec, **videoscene.place_character(by_id[actor], by_id[actor]["rig"], spec, solved[set_name], raw[set_name], stage)}

    def focus_xy(set_name: str, focus: str | None, sh: dict[str, Any]) -> tuple[float, float]:
        if "at_xy" in sh:
            return tuple(sh["at_xy"])
        if focus in by_id:
            return tuple(stand(set_name, focus)["offset"])
        if focus in solved[set_name]:
            o = solved[set_name][focus]
            return (o["cx"], (o["top"] + o["bottom"]) / 2)
        return (0, 0)

    def cast_entries(set_name: str, entries: list[Any]) -> list[dict[str, Any]]:
        out = []
        for c in entries:
            cid = c if isinstance(c, str) else c["id"]
            st = stand(set_name, cid)
            out.append({"id": cid, "offset": st["offset"], "pose": st.get("pose", "stand_still"), **({"seated": True} if st.get("seated") else {}), **({} if isinstance(c, str) else {k: v for k, v in c.items() if k != "id"})})
        return out

    def check_legs(shot_id: str, set_name: str, ids: list[str], cam: dict[str, Any]) -> None:
        """A seated character (rigs draw hips-up, no seated pose) is fine when a solid front object stands over his missing
        legs (top above the hips, bottom on the floor, wider than he is); otherwise the camera must stay above the hips."""
        bottom = max(cam["viewBox"][1] + cam["viewBox"][3], (cam.get("push_to") or [0, 0, 0, 0])[1] + (cam.get("push_to") or [0, 0, 0, 0])[3])
        for cid in ids:
            st = stand(set_name, cid)
            if not st.get("seated"):
                continue
            dim = videoscene.rig_dim(by_id[cid]["rig"])["dim"]
            covers = [o for o in solved[set_name].values() if o.get("front") and abs(o["cx"] - st["offset"][0]) <= o["w"] / 2 - dim["sw"] and o["top"] <= st["hip_y"] and o["bottom"] >= stage["floor"] - 5]
            if not covers and bottom > st["hip_y"]:
                msg = (f"shot {shot_id}: {cid} is seated but {by_id[cid]['rig']} has no seated pose and nothing solid (a front object from above his hips to the floor) "
                       f"hides his missing legs; the camera shows down to y={bottom:.0f}, below his hips (y={st['hip_y']:.0f}): crop higher, add a desk, or wait for a rig version with a seated pose")
                raise ValueError(msg)

    scenes: dict[str, Any] = {}
    all_props: dict[str, Any] = {}
    for si, s in enumerate(tl["scenes"]):
        d = design["scenes"].get(s["title"])
        if d is None:
            msg = f'design file has no scene "{s["title"]}"'
            raise KeyError(msg)
        bl = beats(tl, s)

        def at(n: int, off: float = 0.0, b: list[int] = bl, title: str = s["title"]) -> dict[str, Any]:
            if not 1 <= n <= len(b):
                msg = f'scene "{title}": beat {n} does not exist (scene has {len(b)} beats)'
                raise ValueError(msg)
            return {"entry": b[n - 1], **({"offset": off} if off else {})}

        used: dict[str, dict[str, Any]] = {}
        shots = []
        for sh in d["shots"]:
            sset = sh.get("set", d["set"])
            ids = [c if isinstance(c, str) else c["id"] for c in sh.get("cast", [])]
            focus = sh.get("focus") or (ids[0] if ids else None)
            fxy = focus_xy(sset, focus, sh)
            out = {k: v for k, v in sh.items() if k not in {"beats", "frame", "focus", "push_in", "at_xy", "camera", "cast", "inset", "offset"}}
            out |= {"at": at(sh["beats"][0], sh.get("offset", 0.0)), "frame": sh["frame"], "set": sset, "beats": sh["beats"], "camera": _camera(sh["frame"], fxy, layout, sh.get("push_in"), sh.get("camera"))}
            out["cast"] = cast_entries(sset, sh.get("cast", []))
            check_legs(sh["id"], sset, ids, out["camera"])
            if "inset" in sh:
                ins = sh["inset"]
                iset = ins["set"]
                iids = [c if isinstance(c, str) else c["id"] for c in ins["cast"]]
                ifocus = ins.get("focus") or iids[0]
                icam = _camera(ins.get("frame", "medium"), focus_xy(iset, ifocus, {}), layout, None, ins.get("camera"), ins["rect"][2] * 16 / (ins["rect"][3] * 9))
                check_legs(sh["id"] + " inset", iset, iids, icam)
                out["inset"] = {**{k: v for k, v in ins.items() if k not in {"frame", "focus"}}, "cast": cast_entries(iset, ins["cast"]), "camera": icam["viewBox"]}
                ids += iids
            for i in ids:
                used.setdefault(i, {k: v for k, v in by_id[i].items() if k not in {"expr", "expr_map", "offset"}})
            shots.append(out)
        for b, ei in enumerate(bl, 1):  # mention test: a beat that names an object must show it
            said = (tl["entries"][ei].get("text") or "").casefold()
            for o in merged[d["set"]]["objects"]:
                if not any(m.casefold() in said for m in o.get("mentions", [])):
                    continue
                if not any(_frame_has(sh, solved, o["id"]) for sh in shots if b in sh["beats"]):
                    msg = f'scene "{s["title"]}" beat {b} says «{o["mentions"][0]}», but no shot of that beat shows "{o["id"]}" in frame'
                    raise ValueError(msg)
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
            if "visible" in c:
                cues.append({**anchor, "actor": c["target"], "channel": "visible", "value": c["visible"]})
        cues += [{"at": 0, "actor": t, "channel": "text", "value": ""} for t in sorted({c["actor"] for c in cues if c["channel"] == "text"})]  # a first text cue must not reach back to t=0: the phone would ring from the start
        cues += [{"at": 0, "actor": t, "channel": "visible", "value": True} for t in sorted({c["actor"] for c in cues if c["channel"] == "visible"} | {i["object"] for i in d.get("interactions", []) if i["type"] == "holds"})]
        cues += _interaction_cues(d.get("interactions", []), merged[d["set"]], solved[d["set"]], stand, d["set"], by_id, at, len(bl), s["title"])
        nxt = tl["scenes"][si + 1]["title"] if si + 1 < len(tl["scenes"]) else None
        prev = design["scenes"].get(tl["scenes"][si - 1]["title"], {}) if si else {}
        scenes[s["title"]] = {
            "set": d["set"], "actors": sorted(used.values(), key=lambda a: a.get("layer", 0)), "cues": cues, "shots": shots,
            **({"transition_out": d["transition_out"]} if "transition_out" in d and nxt else {}),
            **({"transition_in": prev["transition_out"]} if "transition_out" in prev else {}),
        }
    set_names = {x["set"] for x in scenes.values()} | {sh.get("set") for x in scenes.values() for sh in x["shots"]} | {sh["inset"]["set"] for x in scenes.values() for sh in x["shots"] if "inset" in sh}
    sets = {}
    for n in sorted(x for x in set_names if x):
        props = []
        for o in solved[n].values():
            look = placeholders["props"].get(o.get("kind", o["id"]), {})
            props.append({**look, **{k: v for k, v in o.items() if k not in {"cx", "top", "bottom"}}})
        sets[n] = {**placeholders["sets"].get(n, {}), "props": props}
    return {
        "schema": SHEET,
        "fps": layout.get("fps", 30),
        "size": layout.get("size", [1280, 720]),
        "camera": layout["camera"],
        "background": layout.get("background", "#26344f"),
        "cast": {v: {"actor": c["id"]} for v, c in cast.items()},
        "sets": sets,
        "props": {**placeholders["props"], **all_props},
        "screens": design.get("screens", {}),
        **({"debug": True} if design.get("debug_labels") else {}),
        "scenes": scenes,
    }


def _interaction_cues(items: list[dict[str, Any]], mset: dict[str, Any], objs: dict[str, dict[str, Any]], stand: Any, set_name: str, by_id: dict[str, Any], at: Any, n_beats: int, title: str) -> list[dict[str, Any]]:
    """Windows of hands_on / holds / looks_at -> pose cues (a hand target is an override of the rig's pose, from the object's real position)."""
    cues: list[dict[str, Any]] = []
    for actor in sorted({i["actor"] for i in items}):
        mine = [i for i in items if i["actor"] == actor]
        st = stand(set_name, actor)
        dim = videoscene.rig_dim(by_id[actor]["rig"])["dim"]
        base_pose = st.get("pose", "stand_still")
        wins = [(i, min(i.get("beats", [1])), max(i.get("beats", [n_beats])) + 1) for i in mine]
        bounds = sorted({w[1] for w in wins} | {w[2] for w in wins if w[2] <= n_beats})
        for b in bounds:
            active = [i for i, lo, hi in wins if lo <= b < hi]
            pose, override = base_pose, {}
            for i in active:
                obj = objs[i["object"]]
                if i["type"] == "holds":
                    pose = "hold_receiver"
                    cues.append({**at(b), "actor": i["object"], "channel": "visible", "value": False})
                elif i["type"] == "hands_on":
                    override |= {**videoscene.hand_targets(st["offset"], dim, obj, actor), **({"_typing": 1} if i.get("typing") else {})}
                elif i["type"] == "looks_at":
                    dx = obj["cx"] - st["offset"][0]
                    override |= {"head": {"yaw": max(-0.45, min(0.45, dx / (0.7 * 742)))}}
                else:
                    msg = f'scene "{title}": unknown interaction type "{i["type"]}"'
                    raise ValueError(msg)
            cues.append({**at(b), "actor": actor, "channel": "pose", "value": pose, "override": override})
        for i, lo, hi in wins:  # a held object comes back when the window ends
            if i["type"] == "holds" and hi <= n_beats:
                cues.append({**at(hi), "actor": i["object"], "channel": "visible", "value": True})
    return cues


def describe(tl: dict[str, Any], design: dict[str, Any]) -> str:
    """The design as a document for review: story, sets (objects, relations, roles), characters, and per shot what is said and shown."""
    out = [f"# Scene design: {design.get('look', '')}", "", design.get("story", ""), ""]
    merged = {n: videoscene.merge_set(design["sets"], n) for n in design["sets"]}
    for n, m in merged.items():
        out += [f"## Set `{n}`" + (f" (extends `{design['sets'][n]['extends']}`)" if "extends" in design["sets"][n] else ""), "", "| object | size (H) | place | role |", "|---|---|---|---|"]
        for o in m["objects"]:
            pl = ", ".join(f"{k}={v}" for k, v in o.get("place", {}).items())
            out.append(f"| `{o['id']}`{' (front)' if o.get('layer') == 'front' else ''} | {o['size'][0]}x{o['size'][1]} | {pl} | {o.get('role', '')} |")
        for who, c in m["characters"].items():
            where = f"seated on `{c['seated_on']}`" if "seated_on" in c else "stands"
            out += ["", f"Character `{who}`: {where}, base pose `{c.get('pose', 'stand_still')}`. {c.get('role', '')}"]
        out.append("")
    out += ["## Grounding: where each object comes from", "", "| object | from |", "|---|---|"]
    seen: set[str] = set()
    for m in merged.values():
        for o in m["objects"]:
            if o["id"] not in seen:
                seen.add(o["id"])
                out.append(f"| `{o['id']}`{' (outside)' if o.get('side') == 'outside' else ''} | {'**invented**' if o.get('from') == 'invented' else '«' + o.get('from', '?') + '»'} |")
    for n, st in design["sets"].items():
        out += [f"| `{snd['id']}` (sound only, not drawn) | «{snd['from']}» |" for snd in st.get("sounds", [])]
    out.append("")
    for s in tl["scenes"]:
        d = design["scenes"][s["title"]]
        bl = beats(tl, s)
        out += [f"## Scene «{s['title']}» (set `{d['set']}`)", "", d.get("story", ""), ""]
        if "transition_out" in d:
            out += [f"Transition out: {d['transition_out']['type']} «{d['transition_out'].get('text', '')}»", ""]
        out += ["| shot | beats (what is heard) | frame | on screen | intent |", "|---|---|---|---|---|"]
        for sh in d["shots"]:
            heard = "; ".join((tl["entries"][bl[b - 1]].get("text") or "sfx " + tl["entries"][bl[b - 1]].get("sfx", ""))[:48] for b in sh["beats"])
            who = ", ".join(c if isinstance(c, str) else c["id"] for c in sh.get("cast", [])) or "no one"
            if "inset" in sh:
                who += f" + inset `{sh['inset']['style']}`: {', '.join(c if isinstance(c, str) else c['id'] for c in sh['inset']['cast'])}"
            out.append(f"| {sh['id']} | {heard} | {sh['frame']}{' + push-in' if sh.get('push_in') else ''} | {who} | {sh.get('intent', '')} |")
        out += ["", "Event map (heard -> shown, in time order):", "", "| beat | heard | shot starts | cues and interactions that start here |", "|---|---|---|---|"]
        for b, ei in enumerate(bl, 1):
            e = tl["entries"][ei]
            heard = f"{e['voice']}: {e['text'][:40]}" if e.get("text") else f"sfx {e.get('sfx', '')}"
            shots_here = ", ".join(sh["id"] + (f"+{sh['offset']}s" if sh.get("offset") else "") for sh in d["shots"] if sh["beats"][0] == b)
            ev = [f"`{c.get('target') or c.get('actor')}` -> {c.get('screen') or c.get('expr') or ('text «' + c['text'] + '»' if 'text' in c else 'visible=' + str(c.get('visible')))}" + (f" (+{c['offset']}s)" if c.get("offset") else "") for c in d.get("cues", []) if c["beat"] == b]
            ev += [f"`{i['actor']}` {i['type']} `{i['object']}`" for i in d.get("interactions", []) if i.get("beats", [None])[0] == b]
            out.append(f"| {b} | {heard} | {shots_here or '-'} | {'; '.join(ev) or '-'} |")
        out += ["", "Interactions:", ""]
        for i in d.get("interactions", []):
            out.append(f"- `{i['actor']}` {i['type']} `{i['object']}`" + (f" (beats {i['beats']})" if "beats" in i else " (whole scene)") + (" typing" if i.get("typing") else ""))
        out += ["", "Cues:", ""]
        for c in d.get("cues", []):
            what = c.get("screen") or c.get("expr") or (f"text «{c['text']}»" if "text" in c else f"visible={c.get('visible')}")
            out.append(f"- beat {c['beat']}: `{c.get('target') or c.get('actor')}` -> {what}")
        out.append("")
    return "\n".join(out)
