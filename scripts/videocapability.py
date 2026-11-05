"""Capability check: what the design asks of rigs, sets, overlays and cards, against what they provide. Run it before any art work.

Needs the script and the design file only: no timeline, no audio, no render. Every requirement is listed with where it is used
and a verdict:  ok | placeholder (flat stand-in, art not drawn yet) | known (the art file's own `rig_gaps` names it, a workaround exists) | gap (missing: blocks).

    needs = check(scenario, design, layout)   # list of dicts; videogates.py reads the blocking ones; video.py capability prints them
"""

import json
import re
from pathlib import Path
from typing import Any

import scenario

ROOT = Path(__file__).resolve().parent.parent / "video"
CORE = ROOT / "engine" / "src" / "core.js"


def engine_overlays() -> set[str]:
    m = re.search(r"var OVER = \{([^}]*)\}", CORE.read_text())
    return {x.split(":")[0].strip() for x in m[1].split(",")} if m else set()


def rig_facts(ref: str) -> dict[str, Any] | None:
    rid, ver = ref.split("@")
    f = ROOT / "rigs" / rid / ver / "rig.json"
    if not f.exists() or not (f.parent / "rig.lock").exists():
        return None
    d = json.loads(f.read_text())
    poses = d.get("poses") or []
    exprs = d.get("expressions") or []
    return {"poses": set(poses if isinstance(poses, list) else poses.keys()), "expressions": set(exprs if isinstance(exprs, list) else exprs.keys()), "body_type": d.get("body_type")}


def _first(pose: str | None) -> str:
    return (pose or "stand_still").split(",")[0].strip()


def check(sc: scenario.Scenario, design: dict[str, Any], layout: dict[str, Any], art_dir: Path | None = None) -> list[dict[str, Any]]:
    """Every requirement of the design with its verdict. Rows: {kind, need, where, status, detail, fix}."""
    art_dir = art_dir or ROOT / "art"
    rows: dict[tuple[str, str], dict[str, Any]] = {}

    def need(kind: str, what: str, where: str, status: str, detail: str = "", fix: str = "") -> None:
        r = rows.setdefault((kind, what), {"kind": kind, "need": what, "where": [], "status": status, "detail": detail, "fix": fix})
        if where and where not in r["where"]:
            r["where"].append(where)

    off = set(design.get("offscreen", layout.get("offscreen", ["narrator"])))
    cast = {v: {**layout.get("cast", {}).get(v, {}), **ov} for v, ov in design.get("cast", {}).items()}
    by_id = {c["id"]: c for c in cast.values() if "id" in c}
    for v in sorted({t.voice for t in sc.turns} - off):
        if v not in cast or "rig" not in cast[v]:
            need("voice", v, "script", "gap", f"voice «{v}» speaks but has no rig in the layout/design cast", "add a cast entry (voice -> rig) or list it under offscreen")
    facts: dict[str, dict[str, Any]] = {}
    for c in by_id.values():
        f = rig_facts(c["rig"])
        if f is None:
            need("rig", c["rig"], c["id"], "gap", "no frozen rig (rig.json + rig.lock) of this id and version", "freeze the rig under video/rigs/<id>/<version>/ (no stand-ins)")
        else:
            facts[c["id"]] = f
            need("rig", c["rig"], c["id"], "ok")

    arts: dict[str, dict[str, Any]] = {}
    for name, st in design.get("sets", {}).items():
        if "art" in st:
            f = art_dir / f"{st['art']}.json"
            if not f.exists():
                need("set", name, name, "gap", f"art file {st['art']}.json is missing", "draw/import the set art (video/art/<art>.json)")
                continue
            arts[name] = json.loads(f.read_text())
            need("set", name, name, "ok", f"art {st['art']}")
            ids = {o["id"] for o in arts[name]["objects"]}
            for rid in st.get("remove", []):
                if rid not in ids:
                    need("object", f"{name}: remove {rid}", name, "gap", "named in `remove` but not an object of the art", "fix the id in the design or the art")
            for who, ch in st.get("characters", {}).items():
                if ch.get("slot") not in arts[name]["slots"]:
                    need("slot", f"{name}: {who} -> {ch.get('slot')}", name, "gap", "the art has no such slot", "add the slot to the art or point the character at an existing one")
            for g in arts[name].get("rig_gaps") or []:
                need("rig_gap", f"{name}: {g}", name, "known", "listed by the art file itself; the set works around it", "a new rig version with the missing pose retires the workaround")
        elif "svg_file" in st:
            f = art_dir / f"{st['svg_file']}.svg"
            need("set", name, name, "ok" if f.exists() else "gap", f"drawing {st['svg_file']}.svg" + ("" if f.exists() else " is missing"), "" if f.exists() else "draw the set")
        else:
            need("set", name, name, "placeholder", "no drawn art: the engine shows a flat stand-in (video/placeholders.json)", "draw the set (art session) before the full render; storyboard works with the stand-in")

    ov_ok = engine_overlays()
    for title, sdesign in design.get("scenes", {}).items():
        sname = sdesign.get("set", "")
        st = design["sets"].get(sname, {})
        for tr in ("transition_out",):
            card = sdesign.get(tr, {}).get("card")
            if card:
                f = ROOT / "art" / "cards" / f"{card}.svg"
                need("card", card, f"{title}: {tr}", "ok" if f.exists() else "gap", "" if f.exists() else "card svg missing", "" if f.exists() else "draw the card (video/art/cards)")
            elif sdesign.get(tr, {}).get("type") == "time_card":
                need("card", f"text «{sdesign[tr].get('text')}»", f"{title}: {tr}", "placeholder", "plain text card on a dark ground", "draw a card (video/art/cards/<id>.svg) for a designed look")
        for o in sdesign.get("overlays_all", []):
            _overlay(o, f"{title}: scene", need, ov_ok)
        for sh in sdesign.get("shots", []):
            where = f"{title}: {sh['id']}"
            sset = sh.get("set", sname)
            sst = design["sets"].get(sset, {})
            for entry in sh.get("cast", []):
                aid = entry if isinstance(entry, str) else entry["id"]
                pose = entry.get("pose") if isinstance(entry, dict) else None
                ch = sst.get("characters", {}).get(aid, {})
                slot = arts.get(sset, {}).get("slots", {}).get(ch.get("slot", ""), {})
                _pose(aid, pose or ch.get("pose") or _first(slot.get("pose")), where, facts, by_id, need, ch.get("seated_on") is not None)
            if "inset" in sh:
                for entry in sh["inset"]["cast"]:
                    aid = entry if isinstance(entry, str) else entry["id"]
                    iset = design["sets"].get(sh["inset"]["set"], {})
                    ch = iset.get("characters", {}).get(aid, {})
                    slot = arts.get(sh["inset"]["set"], {}).get("slots", {}).get(ch.get("slot", ""), {})
                    _pose(aid, (entry.get("pose") if isinstance(entry, dict) else None) or ch.get("pose") or _first(slot.get("pose")), where + " inset", facts, by_id, need, False)
            for o in sh.get("overlays", []):
                _overlay(o, where, need, ov_ok)
            for subj in sh.get("subjects", []):
                if subj in by_id or subj in {a["id"] for a in (arts.get(sset, {}).get("objects") or [])} or subj in sst.get("regions", {}) or subj in {p.get("id") for p in sst.get("props", [])}:
                    continue
                if sset in arts or "svg_file" in sst:
                    need("subject", f"{sset}: {subj}", where, "gap", "a subject that is no character, drawn object, prop or region of the set", "name the region in the design (`regions`) or draw the object")
        for c in sdesign.get("cues", []):
            where = f"{title}: beat {c['beat']}"
            if "pose" in c and "actor" in c:
                _pose(c["actor"], c["pose"], where, facts, by_id, need, False)
            if "expr" in c and c["actor"] in facts and c["expr"] not in facts[c["actor"]]["expressions"]:
                need("expression", f"{c['actor']}: {c['expr']}", where, "gap", "the rig has no such expression", "use an existing expression or add one in a new rig version")
            if "screen" in c and c["screen"] not in design.get("screens", {}):
                need("screen", c["screen"], where, "gap", "no screen content of that name in the design", "define it under `screens`")
        for i in sdesign.get("interactions", []):
            if i["type"] == "holds":
                _pose(i["actor"], "hold_receiver", f"{title}: holds {i['object']}", facts, by_id, need, False)
    for a, c in by_id.items():
        if a not in facts:
            continue
        for tag, e in (c.get("expr_map") or {}).items():
            if e not in facts[a]["expressions"]:
                need("expression", f"{a}: {e}", f"layout expr_map «{tag}»", "gap", "mapped from a script tag but the rig lacks it", "fix the map or the rig")
        if c.get("expr") and c["expr"] not in facts[a]["expressions"]:
            need("expression", f"{a}: {c['expr']}", "default expression", "gap", "the rig lacks it", "fix the cast entry")
    return sorted(rows.values(), key=lambda r: ({"gap": 0, "placeholder": 1, "known": 2, "ok": 3}[r["status"]], r["kind"], r["need"]))


def _pose(actor: str, pose: str, where: str, facts: dict[str, Any], by_id: dict[str, Any], need: Any, seated: bool) -> None:
    if actor not in facts:
        return
    if pose not in facts[actor]["poses"]:
        need("pose", f"{actor}: {pose}", where, "gap", f"rig {by_id[actor]['rig']} has no pose «{pose}»", "new rig version with the pose (frozen versions are not edited), or change the shot")
    elif seated and not any(p.startswith("sit") for p in facts[actor]["poses"]):
        need("pose", f"{actor}: seated", where, "gap", "seated in the design but the rig has no sit pose", "new rig version, or hide the legs behind a front object")
    else:
        need("pose", f"{actor}: {pose}", where, "ok")


def _overlay(o: dict[str, Any], where: str, need: Any, ov_ok: set[str]) -> None:
    k = o.get("kind")
    if k not in ov_ok:
        need("overlay", str(k), where, "gap", f"engine has no overlay kind «{k}» (has: {', '.join(sorted(ov_ok))})", "add the kind to core.js (engine work) or pick an existing one")
    else:
        need("overlay", k, where, "ok")
    if o.get("card"):
        f = ROOT / "art" / "cards" / f"{o['card']}.svg"
        need("card", o["card"], where, "ok" if f.exists() else "gap", "" if f.exists() else "card svg missing", "" if f.exists() else "draw the card")


def markdown(rows: list[dict[str, Any]], title: str = "") -> str:
    """The gap report as a document: what blocks first, then stand-ins, known workarounds; ok rows are only counted."""
    head = {"gap": "Gaps (block the full render)", "placeholder": "Placeholders (stand-ins, art not drawn)", "known": "Known rig gaps (worked around)"}
    out = [f"# Capability report{': ' + title if title else ''}", ""]
    counts = {s: sum(r["status"] == s for r in rows) for s in ("gap", "placeholder", "known", "ok")}
    out += [f"gaps {counts['gap']} · placeholders {counts['placeholder']} · known workarounds {counts['known']} · ok {counts['ok']}", ""]
    for status, h in head.items():
        sel = [r for r in rows if r["status"] == status]
        if not sel:
            continue
        out += [f"## {h}", "", "| kind | need | where | detail | fix |", "|---|---|---|---|---|"]
        out += [f"| {r['kind']} | {r['need']} | {', '.join(r['where'][:6])}{' …' if len(r['where']) > 6 else ''} | {r['detail']} | {r['fix']} |" for r in sel]
        out.append("")
    return "\n".join(out)
