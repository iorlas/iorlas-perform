"""Scene model solver: objects with relations -> positions; characters with postures and interactions -> offsets and pose overrides.

Pure Python. Authors write *what is where and what the characters do with it* (scene-design/2, in the design file); this module
derives pixels. Units: H = a person's height in px (stage.H), the floor is stage.floor; sizes and offsets are in H.

Object place (all optional, combine):
    "on": "floor" | <object id>     rests on top of it (default floor);  "up": raise by this much (wall-mounted things)
    "x": centre, or "centered_on": id (+ "dx"), "left_of": id / "right_of": id (+ "gap")
    "layer": "back" (default, behind the cast) | "front" (a desk a person sits behind)
Character posture in a set:
    {"seated_on": <object id>, "pose": "stand_still", "head": {...}}   or   {"x": 0, "pose": ...}   (stands on the floor)
Interactions (scene level, windowed by beats):
    hands_on <object> [typing]   both hands to the object's top surface, IK targets from the object's real position
    holds <object>               hold_receiver pose; the object disappears from its place while held
    looks_at <object>            head turned toward it
Checks that fail loudly instead of drawing nonsense: a hand target out of arm's reach; a seated character (the rigs have no
seated pose except Mihalych's) in a shot whose camera shows below the desk top that hides the missing legs.
"""

import json
import math
from pathlib import Path
from typing import Any

RIGS = Path(__file__).resolve().parent.parent / "video" / "rigs"


def rig_dim(rig: str) -> dict[str, Any]:
    rid, ver = rig.split("@")
    return json.loads((RIGS / rid / ver / "rig.json").read_text())


def merge_set(sets: dict[str, Any], name: str) -> dict[str, Any]:
    """A set with its `extends` chain applied: objects by id (child replaces), `remove` drops ids, characters merged."""
    s = sets[name]
    if "extends" not in s:
        return {"objects": list(s.get("objects", [])), "characters": dict(s.get("characters", {})), **{k: v for k, v in s.items() if k not in {"objects", "characters", "extends", "remove"}}}
    base = merge_set(sets, s["extends"])
    objs = {o["id"]: o for o in base["objects"] if o["id"] not in s.get("remove", [])}
    for o in s.get("objects", []):
        objs[o["id"]] = o
    return {**base, **{k: v for k, v in s.items() if k not in {"objects", "characters", "extends", "remove"}}, "objects": list(objs.values()), "characters": {**base["characters"], **s.get("characters", {})}}


def solve_objects(objects: list[dict[str, Any]], stage: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Object specs -> {id: instance} with at/w/h in px plus cx, top, bottom (px) for relations and checks."""
    big_h, floor = stage["H"], stage["floor"]
    by_id = {o["id"]: o for o in objects}
    done: dict[str, dict[str, Any]] = {}

    def solve(oid: str, trail: tuple[str, ...] = ()) -> dict[str, Any]:
        if oid in done:
            return done[oid]
        if oid in trail:
            msg = f"objects depend on each other in a loop: {' -> '.join([*trail, oid])}"
            raise ValueError(msg)
        o, pl = by_id[oid], by_id[oid].get("place", {})
        w, h = o["size"][0] * big_h, o["size"][1] * big_h
        t = (*trail, oid)
        base = floor if pl.get("on", "floor") == "floor" else solve(pl["on"], t)["top"]
        bottom = base - pl.get("up", 0) * big_h
        if "x" in pl:
            cx = pl["x"] * big_h
        elif "centered_on" in pl:
            cx = solve(pl["centered_on"], t)["cx"] + pl.get("dx", 0) * big_h
        elif "left_of" in pl:
            other = solve(pl["left_of"], t)
            cx = other["cx"] - other["w"] / 2 - pl.get("gap", 0) * big_h - w / 2
        elif "right_of" in pl:
            other = solve(pl["right_of"], t)
            cx = other["cx"] + other["w"] / 2 + pl.get("gap", 0) * big_h + w / 2
        else:
            msg = f'object "{oid}" has no horizontal place (x, centered_on, left_of or right_of)'
            raise ValueError(msg)
        inst = {k: v for k, v in o.items() if k not in {"size", "place", "layer", "role", "seat_h", "from", "side", "mentions"}}
        inst |= {"w": round(w), "h": round(h), "at": [round(cx - w / 2), round(bottom - h)], "cx": cx, "top": bottom - h, "bottom": bottom}
        if o.get("layer") == "front":
            inst["front"] = True
        done[oid] = inst
        return inst

    for oid in by_id:
        solve(oid)
    return done


def place_character(actor: dict[str, Any], rig: str, spec: dict[str, Any], objs: dict[str, dict[str, Any]], raw: dict[str, dict[str, Any]], stage: dict[str, Any]) -> dict[str, Any]:
    """Offset (the rig's origin is its neck base) and flags for a character standing or seated in a set."""
    dim, big_h, floor = rig_dim(rig)["dim"], stage["H"], stage["floor"]
    if "seated_on" in spec:
        seat = objs[spec["seated_on"]]
        seat_y = floor - raw[spec["seated_on"]].get("seat_h", 0.26) * big_h
        # rigs without a seated pose (all but Mihalych) draw from the hips up: legs are never drawn, and a desk must hide the missing ones
        return {"offset": [round(seat["cx"]), round(seat_y - dim["hipY"])], "seated": True, "hip_y": seat_y}
    x = spec.get("x", 0) * big_h
    return {"offset": [round(x), round(floor - (dim.get("floor", dim.get("ankleY", 592) + 20)))]}


def reach_check(actor: str, offset: list[int], dim: dict[str, Any], target: tuple[float, float], what: str) -> None:
    for side in (-1, 1):
        sx, sy = offset[0] + side * (dim["sw"] - 12), offset[1] + dim["shY"]
        d = math.hypot(target[0] - sx, target[1] - sy)
        if d > dim["UA"] + dim["FA"]:
            msg = f"{actor}: {what} is {d:.0f}px from the shoulder, arm reach is {dim['UA'] + dim['FA']}px: move the object or the character"
            raise ValueError(msg)


def hand_targets(offset: list[int], dim: dict[str, Any], obj: dict[str, Any], actor: str) -> dict[str, Any]:
    """IK targets in the rig's local space for both hands on an object's top surface."""
    y = obj["top"] - 4
    spread = obj["w"] * 0.6
    out = {}
    for side, key in ((-1, "L"), (1, "R")):
        world = (obj["cx"] + side * spread / 2, y)
        reach_check(actor, offset, dim, world, f'hands on {obj["id"]}')
        out[key] = {"h": [round(world[0] - offset[0]), round(world[1] - offset[1])]}
    return out
