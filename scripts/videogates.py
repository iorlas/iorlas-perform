"""Gates: checks on the resolved film (estimated or real timeline) that find, in seconds, what the full render showed only at the end.

Each finding: {gate, severity: "block"|"warn", scene, shot, t, message, fix}. A blocking finding stops the ladder (exit 1 in video.py gates).
Thresholds come from the format profile (video/formats/*.json `gates`); a world may ship its own profile.

    capability  poses, sets, overlays, cards the design needs vs what exists        (videocapability.py)
    framing     a subject cut by the camera, a seated character with no legs hidden, a named object not in frame
    rhythm      a visual change every few seconds: no static stretch over the limit, no shot shorter than the minimum
    flicker     an overlay or screen state shown too briefly to read, or flipping back and forth
    zones       subtitle band and UI-unsafe zones free of overlays; a 9:16 crop that holds every subject
    textfit     captions and card texts fit their line at the minimum font size
    shorts      hook inside the first seconds, first voice by T, total under the limit
    distinct    sets and scene titles against earlier episodes
"""

import difflib
import json
import re
from pathlib import Path
from typing import Any

import scenario
import videocapability
import videopreprod

CHAR_W = 0.55  # glyph width / font size for the engine's sans text (core.js uses the same constant)
READ_CPS = 14.0  # characters a viewer reads per second


def finding(gate: str, severity: str, message: str, fix: str = "", scene: str = "", shot: str = "", t: float | None = None) -> dict[str, Any]:
    return {"gate": gate, "severity": severity, "scene": scene, "shot": shot, "t": None if t is None else round(t, 2), "message": message, "fix": fix}


def run(plan: dict[str, Any], *, previous: list[Path] | None = None, only: set[str] | None = None) -> list[dict[str, Any]]:
    """All gates on a prepared plan (videopreprod.prepare). `only`: gate names to run (default: all)."""
    fmt = plan["fmt"]
    g = fmt["gates"]
    out: list[dict[str, Any]] = []
    want = lambda n: not only or n in only  # noqa: E731
    if plan["fatal"]:
        return [finding("design", "block", plan["fatal"], "fix the design or the cast/rig it names; nothing downstream can run")]
    if want("capability") and plan["design"]:
        for r in videocapability.check(plan["sc"], plan["design"], plan["layout"]):
            if r["status"] == "gap":
                out.append(finding("capability", "block", f"{r['kind']} {r['need']}: {r['detail']}", r["fix"], shot="; ".join(r["where"][:3])))
            elif r["status"] == "placeholder":
                out.append(finding("capability", "warn", f"{r['kind']} {r['need']}: {r['detail']}", r["fix"], shot="; ".join(r["where"][:3])))
    if want("framing"):
        for p in plan["report"].get("problems", []):
            out.append(finding("framing", "block", p["message"], "move the camera/frame, drop the subject from the shot, or fix the set", scene=p["scene"], shot=p["shot"]))
        if fmt.get("crop"):
            out += crop_fit(plan)
    for gid, shots in plan["shots"].items():
        if want("rhythm"):
            out += rhythm(shots, g)
        if want("flicker"):
            out += flicker(shots)
        if want("zones"):
            out += zones(shots, plan, fmt)
        if want("textfit"):
            out += textfit(shots, fmt)
    if want("shorts"):
        out += shorts(plan, fmt)
    if want("distinct") and previous:
        out += distinct(plan, previous)
    t0 = {gr["title"]: gr["t0"] for gr in plan["groups"]}
    for f in out:  # film time next to the scene-relative one
        if f["scene"] in t0 and f["t"] is not None:
            f["film_t"] = round(f["t"] + t0[f["scene"]], 2)
    return out


def blocking(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [f for f in findings if f["severity"] == "block"]


# ---- rhythm ----

def events(shots: dict[str, Any]) -> list[tuple[float, str]]:
    """Moments the picture changes in a scene: cuts, overlay and screen/pose/text/visibility changes (expressions are minor and counted separately)."""
    ev: list[tuple[float, str]] = []
    for sh, t0, _ in videopreprod.shot_spans(shots):
        ev.append((t0, "cut"))
        for o in sh.get("overlays", []):
            ev += [(o["t0"], "overlay"), (o["t1"], "overlay-end")] + [(s["t0"], "overlay-state") for s in o.get("states", [])]
        if "slide" in sh.get("inset", {}):
            ev.append((sh["inset"]["slide"]["t0"], "inset"))
    for tr in shots.get("tracks", []):
        if tr["channel"] in {"pose", "screen", "text", "visible"}:
            ev += [(k["t"], tr["channel"]) for k in tr["keys"][1:] if k["t"] > 0]
    for t in shots.get("transitions", []):
        ev += [(t["t0"], "transition"), (t["t1"], "transition")]
    return sorted(ev)


def rhythm(shots: dict[str, Any], g: dict[str, Any]) -> list[dict[str, Any]]:
    """No static stretch over the limit (a stretch is time with no event and no camera move), no shot under the minimum."""
    out: list[dict[str, Any]] = []
    scene = shots["title"]
    moves = [(t0, t1) for sh, t0, t1 in videopreprod.shot_spans(shots) if sh.get("camera", {}).get("push_to")]
    minor = sorted(k["t"] for tr in shots.get("tracks", []) if tr["channel"] == "expr" for k in tr["keys"][1:] if k["t"] > 0)
    pts = sorted({0.0, shots["duration"], *[t for t, _ in events(shots) if 0 <= t <= shots["duration"]]})
    spans = list(zip(pts, pts[1:], strict=False))
    # a camera move counts as motion: a push-in resets the clock at its start and at every second of its length
    for t0, t1 in moves:
        pts = sorted({*pts, *[t0 + i * 1.0 for i in range(int(t1 - t0) + 1) if t0 + i * 1.0 < t1]})
    spans = list(zip(pts, pts[1:], strict=False))
    for a, b in spans:
        if b - a > g["static_warn_s"]:
            shot = next((sh["id"] for sh, t0, t1 in videopreprod.shot_spans(shots) if t0 <= a < t1), "")
            sev = "block" if b - a > g["static_block_s"] else "warn"
            exp = [m for m in minor if a < m < b]
            out.append(finding("rhythm", sev, f"static for {b - a:.1f}s ({a:.1f}-{b:.1f}s, shot {shot}): no cut, overlay, pose, screen or camera move" + (f", only {len(exp)} expression change(s)" if exp else ""),
                               "cut to another angle or an insert, add a push-in, a screen/overlay beat or a pose change inside the stretch", scene=scene, shot=shot, t=a))
    for sh, t0, t1 in videopreprod.shot_spans(shots):
        if t1 - t0 < g["shot_min_s"] and t1 < shots["duration"] - 0.01:
            out.append(finding("rhythm", "warn", f"shot {sh['id']} lasts {t1 - t0:.2f}s (< {g['shot_min_s']}s): too short to read", "merge it with a neighbour or move the beat", scene=scene, shot=sh["id"], t=t0))
    return out


# ---- flicker ----

def flicker(shots: dict[str, Any]) -> list[dict[str, Any]]:
    """An overlay shown for less than it takes to see it, a state that flips back within a second, text gone before it can be read."""
    out: list[dict[str, Any]] = []
    scene = shots["title"]
    for sh, t0, t1 in videopreprod.shot_spans(shots):
        for o in sh.get("overlays", []):
            vis = min(o["t1"], t1) - o["t0"]
            if 0 < vis < 0.6 and not o.get("grow"):
                out.append(finding("flicker", "warn", f"overlay {o.get('kind')} on shot {sh['id']} is visible {vis:.2f}s: a flash", "hold it for >= 0.6 s or drop it", scene=scene, shot=sh["id"], t=o["t0"]))
            st = o.get("states", [])
            for a, b in zip(st, st[1:], strict=False):
                if b["t0"] - a["t0"] < 0.4:
                    out.append(finding("flicker", "warn", f"overlay {o.get('kind')} on shot {sh['id']} changes state twice within {b['t0'] - a['t0']:.2f}s", "space the state changes >= 0.4 s apart", scene=scene, shot=sh["id"], t=a["t0"]))
            for s in st:
                shown = (min(o["t1"], t1) - s["t0"]) if s is st[-1] else min(o["t1"], t1) - s["t0"]
                lines = s.get("lines") or []
                chars = max((len(x) for x in lines), default=0)
                nxt = next((x["t0"] for x in st if x["t0"] > s["t0"]), None)
                held = (nxt if nxt is not None else min(o["t1"], t1)) - s["t0"]
                if lines and chars and held < 0.8 and nxt is not None:
                    out.append(finding("flicker", "warn", f"overlay {o.get('kind')} state at {s['t0']:.1f}s holds {held:.2f}s before the next state", "give each text state >= 0.8 s", scene=scene, shot=sh["id"], t=s["t0"]))
                del shown
    for tr in shots.get("tracks", []):
        if tr["channel"] not in {"screen", "text", "visible", "pose"}:
            continue
        ks = tr["keys"]
        for a, b, c in zip(ks, ks[1:], ks[2:], strict=False):
            if a.get("value") == c.get("value") and a.get("value") != b.get("value") and c["t"] - a["t"] < 1.0 and b["t"] > 0:
                out.append(finding("flicker", "warn", f"{tr['actor']} {tr['channel']} flips «{a.get('value')}» -> «{b.get('value')}» -> back within {c['t'] - a['t']:.2f}s", "merge the two cues or move them apart", scene=scene, t=a["t"]))
    return out


# ---- zones ----

def overlay_box(o: dict[str, Any], vb: list[float]) -> list[float]:
    """An overlay's rect as fractions of the frame (set-space rects are mapped through the camera)."""
    r = o["rect"]
    if o.get("space") == "set":
        return [(r[0] - vb[0]) / vb[2], (r[1] - vb[1]) / vb[3], r[2] / vb[2], r[3] / vb[3]]
    return list(r)


def zones(shots: dict[str, Any], plan: dict[str, Any], fmt: dict[str, Any]) -> list[dict[str, Any]]:
    """Subtitles are on screen whenever someone speaks: an overlay in the subtitle band during speech blocks them. Overlays in UI-unsafe zones warn."""
    out: list[dict[str, Any]] = []
    sub = fmt.get("subtitle", {}).get("y")
    z = fmt.get("zones", {})
    speech = [(e["start"], e["end"]) for e in plan["entries"] if "turn" in e and e.get("text")]
    g0 = next((g for g in plan["groups"] if g["title"] == shots["title"]), None)
    off = g0["t0"] if g0 else 0.0
    for sh, t0, t1 in videopreprod.shot_spans(shots):
        vb = sh["camera"]["viewBox"]
        for o in sh.get("overlays", []):
            x, y, w, h = overlay_box(o, vb)
            a, b = max(o["t0"], t0), min(o["t1"], t1)
            if sub and y < sub[1] and y + h > sub[0] and any(max(a, s - off) < min(b, e - off) for s, e in speech):
                out.append(finding("zones", "block", f"overlay {o.get('kind')} on shot {sh['id']} covers the subtitle band ({sub[0]:.0%}-{sub[1]:.0%} of the height) while someone speaks", "move the overlay out of the band or shrink it", scene=shots["title"], shot=sh["id"], t=a))
            unsafe = (z.get("top", 0) and y < z["top"] and h > 0) or (z.get("bottom", 0) and y + h > 1 - z["bottom"]) or (z.get("right", 0) and x + w > 1 - z["right"]) or (z.get("left", 0) and x < z["left"])
            if unsafe and (z.get("right", 0) >= 0.1 or z.get("bottom", 0) >= 0.2):  # the 5% title-safe margin of 16:9 is not worth a warning per overlay
                out.append(finding("zones", "warn", f"overlay {o.get('kind')} on shot {sh['id']} reaches into the platform UI zone", "keep it inside the safe centre", scene=shots["title"], shot=sh["id"], t=a))
    return out


def crop_fit(plan: dict[str, Any]) -> list[dict[str, Any]]:
    """9:16 from a 16:9 camera: the window is viewBox height * 9/16 wide; subjects that do not fit inside it are lost in the vertical cut."""
    out: list[dict[str, Any]] = []
    cw, ch = plan["fmt"]["crop"]
    for gid, shots in plan["shots"].items():
        boxes_of = plan["report"].get("shots", {}).get(shots["title"], {})
        for sh, _t0, _t1 in videopreprod.shot_spans(shots):
            bx = list(boxes_of.get(sh["id"], {}).values())
            if len(bx) < 2:
                continue
            vb = sh["camera"]["viewBox"]
            win = vb[3] * cw / ch
            width = max(b[0] + b[2] for b in bx) - min(b[0] for b in bx)
            if width > win:
                out.append(finding("zones", "block", f"shot {sh['id']}: subjects span {width:.0f} units, a 9:16 crop of this camera holds {win:.0f}", "a vertical camera (one subject, or reframe) is needed for Shorts", scene=shots["title"], shot=sh["id"], t=sh["t0"]))
    return out


# ---- text fit ----

def textfit(shots: dict[str, Any], fmt: dict[str, Any]) -> list[dict[str, Any]]:
    """Captions fit one line of the profile's width; card text fits the frame at the engine's size (14% of the height)."""
    out: list[dict[str, Any]] = []
    g = fmt["gates"]
    for c in shots.get("captions", []):
        n = len(" ".join(w["w"] for w in c["words"]))
        if n > g["caption_chars_per_line"] + 4:
            out.append(finding("textfit", "block", f"caption «{' '.join(w['w'] for w in c['words'])}» is {n} chars, the line holds {g['caption_chars_per_line']}", "shorten the line or split the chunk", scene=shots["title"], t=c["t0"]))
        if c["t1"] - c["t0"] < len(" ".join(w["w"] for w in c["words"])) / (READ_CPS * 1.6):
            out.append(finding("textfit", "warn", f"caption «{' '.join(w['w'] for w in c['words'])}» is up for {c['t1'] - c['t0']:.1f}s: hard to read", "give the line more time (cut earlier lines) or shorten it", scene=shots["title"], t=c["t0"]))
    w_px, h_px = fmt["size"]
    for tr in shots.get("transitions", []):
        txt = tr.get("text", "")
        if tr.get("card_svg") or not txt:
            continue
        fs_px = h_px * 0.14
        width = len(txt) * fs_px * CHAR_W
        if width > w_px * 0.92:
            out.append(finding("textfit", "block", f"card text «{txt}» needs {width:.0f}px of {w_px}px at the engine's size", "shorten the text or draw the card", scene=shots["title"], t=tr["t0"]))
        if fs_px < g["min_font_px"]:
            out.append(finding("textfit", "warn", f"card text «{txt}» is {fs_px:.0f}px, under the {g['min_font_px']}px minimum", "a larger card text size", scene=shots["title"], t=tr["t0"]))
        if tr["t1"] - tr["t0"] < len(txt) / READ_CPS + 0.5:
            out.append(finding("textfit", "warn", f"card «{txt}» is up {tr['t1'] - tr['t0']:.1f}s: short for its length", "hold the card longer", scene=shots["title"], t=tr["t0"]))
    return out


# ---- shorts / hook ----

def shorts(plan: dict[str, Any], fmt: dict[str, Any]) -> list[dict[str, Any]]:
    """Length, hook, first voice. Active where the profile sets the limits (shorts, 3-minute)."""
    g = fmt["gates"]
    out: list[dict[str, Any]] = []
    total = plan["duration"]
    if g.get("total_max_s") and total > g["total_max_s"]:
        out.append(finding("shorts", "block", f"film is {total:.0f}s, the format limit is {g['total_max_s']}s", "cut lines or tighten pauses; the estimate error is about ±5%"))
    tgt = g.get("total_target_s")
    if tgt and total < tgt[0]:
        out.append(finding("shorts", "warn", f"film is {total:.0f}s, under the {tgt[0]}s target"))
    first = next((e for e in plan["entries"] if "turn" in e and e.get("text")), None)
    if first and g.get("first_voice_by_s") is not None and first["start"] > g["first_voice_by_s"]:
        out.append(finding("shorts", "warn" if first["start"] <= (g.get("hook_s") or 99) else "block", f"first voice at {first['start']:.1f}s (limit {g['first_voice_by_s']}s)", "trim lead-in silence; open on a line, not an ambience fade", t=first["start"]))
    if g.get("hook_s") and plan["groups"]:
        s0 = plan["shots"][plan["groups"][0]["id"]]
        sh0, _, e0 = videopreprod.shot_spans(s0)[0]
        if not sh0.get("cast") and not s0.get("transitions"):
            out.append(finding("shorts", "warn", f"first frame (shot {sh0['id']}) has no character: a swipe decision is made on frame 1", "open on a face or a character in motion", scene=s0["title"], shot=sh0["id"], t=0))
        if first and first["voice"] == "narrator" and first["end"] - first["start"] > g["hook_s"] * 2:
            out.append(finding("shorts", "warn", f"the hook is a narrator line of {first['end'] - first['start']:.0f}s", f"open on the funniest standalone line; the first {g['hook_s']:.0f}s decide the swipe", t=first["start"]))
    return out


# ---- distinctness ----

def _sig(design: dict[str, Any], sc: scenario.Scenario | None, title: str) -> dict[str, Any]:
    return {"title": title, "sets": set(design.get("sets", {})), "scenes": set(design.get("scenes", {})), "voices": {t.voice for t in sc.turns} if sc else set()}


def distinct(plan: dict[str, Any], previous: list[Path]) -> list[dict[str, Any]]:
    """Against earlier episodes' design files: the same set ids, the same scene titles, a near-identical title. Repeats are fine in a series; copies are not."""
    out: list[dict[str, Any]] = []
    mine = _sig(plan["design"] or {}, plan["sc"], "")
    for p in previous:
        d = json.loads(p.read_text())
        theirs = _sig(d, None, p.stem)
        both = mine["sets"] & theirs["sets"]
        union = mine["sets"] | theirs["sets"]
        if union and len(both) / len(union) > 0.6:
            out.append(finding("distinct", "warn", f"{len(both)}/{len(union)} of the sets are the same as in {p.stem}: {', '.join(sorted(both))}", "give this episode at least one place of its own"))
        same = mine["scenes"] & theirs["scenes"]
        for s in same:
            out.append(finding("distinct", "warn", f"scene title «{s}» also in {p.stem}", "rename or re-place the scene"))
        for a in mine["scenes"]:
            for b in theirs["scenes"] - same:
                if difflib.SequenceMatcher(None, a.casefold(), b.casefold()).ratio() > 0.85:
                    out.append(finding("distinct", "warn", f"scene «{a}» is nearly the same as «{b}» in {p.stem}", "differentiate the places"))
    return out


def markdown(findings: list[dict[str, Any]], title: str = "", fmt_id: str = "") -> str:
    out = [f"# Gates{': ' + title if title else ''} ({fmt_id})", ""]
    nb, nw = len(blocking(findings)), len(findings) - len(blocking(findings))
    out += [f"**blocking {nb} · warnings {nw}**", ""]
    if not findings:
        return "\n".join([*out, "no findings"])
    groups: dict[tuple[str, str, str, str], list[dict[str, Any]]] = {}
    for f in findings:  # one row per kind of finding per scene: the same defect on eleven shots is one row listing them
        key = (f["severity"], f["gate"], f["scene"], re.sub(r"shot [\w.]+|on shot [\w.]+|[\d.]+s?", "#", f["message"]))
        groups.setdefault(key, []).append(f)
    out += ["| severity | gate | where | message | fix |", "|---|---|---|---|---|"]
    for (sev, gate, scene, _), fs in sorted(groups.items(), key=lambda kv: (kv[0][0] != "block", kv[0][1], kv[1][0].get("film_t", -1))):
        shots = ", ".join(dict.fromkeys(f["shot"] for f in fs if f["shot"]))
        at = f"{fs[0].get('film_t', fs[0]['t'])}s" if fs[0]["t"] is not None else ""
        where = " ".join(x for x in (scene, f"shots {shots}" if shots and len(fs) > 1 else shots, f"@{at}" if at else "") if x)
        out.append(f"| {sev} | {gate} | {where} | {fs[0]['message']}{f' (+{len(fs) - 1} more)' if len(fs) > 1 else ''} | {fs[0]['fix']} |")
    return "\n".join(out)

