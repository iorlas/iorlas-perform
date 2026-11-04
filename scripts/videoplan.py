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
import re
import struct
import wave
from pathlib import Path
from typing import Any

SHEET = "scene-sheet/1"
TIMELINE = "timeline/2"
SHOTS = "shots/1"  # shots/2 when a scene has a shot list: same keys plus set, shots, sets, props, screens, transitions


def timeline_v2(
    v1: list[dict[str, Any]], *, audio: str, duration: float, sr: int, breaks: list[int] = (), cues: list[dict[str, Any]] = ()
) -> dict[str, Any]:
    """Wrap scene.py's timeline: add the audio name, its length, the scenes in order and the author's screen cues.

    A scene is a scenario heading (location change) or the stretch after a `{pause}`: `breaks` are the item numbers of the pauses
    (turn numbers count scenario items, so a pause sits between two turn numbers). A scene continued after a pause is titled
    "<title> · 2", "<title> · 3"; the sheet has an entry per title. `cues` are scenario `<!-- screen: ... -->` directives.
    """
    turns = [e["turn"] for e in v1 if "turn" in e]
    if len(turns) != len(set(turns)):
        msg = "timeline has repeated turn numbers (an intro joined to an episode): not supported for video yet"
        raise ValueError(msg)
    scenes: list[dict[str, Any]] = []
    parts: dict[str, int] = {}
    for e in v1:
        if "turn" not in e:
            continue
        title = e.get("scene") or "(no scene)"
        last = scenes[-1] if scenes else None
        paused = last and any(last["turns"][-1] < k < e["turn"] for k in breaks)
        if last and last["base"] == title and not paused:
            last["turns"].append(e["turn"])
            continue
        parts[title] = parts.get(title, 0) + 1
        scenes.append({"title": title if parts[title] == 1 else f"{title} · {parts[title]}", "base": title, "ambience": e.get("ambience"), "turns": [e["turn"]]})
    return {
        "schema": TIMELINE,
        "audio": audio,
        "sr": sr,
        "duration": round(duration, 3),
        "scenes": [{k: v for k, v in s.items() if k != "base"} for s in scenes],
        "cues": list(cues),
        "entries": v1,
    }


def _tags(text: str) -> list[str]:
    m = re.match(r"\s*\[([^\]]*)\]", text)
    return [t.strip().lower() for t in m.group(1).split(",")] if m else []


def _pick(layout_map: dict[str, str], tags: list[str]) -> str | None:
    """First tag (or a word in a tag) that the map knows."""
    for t in tags:
        if t in layout_map:
            return layout_map[t]
    for t in tags:
        for w in t.split():
            if w in layout_map:
                return layout_map[w]
    return None


def _screen_cues(entries: list[dict[str, Any]], turns: list[int], authored: dict[int, dict[str, Any]], scr: dict[str, Any], ambience: str | None) -> list[dict[str, Any]]:
    """Object (screen) cues of one scene from the timeline: ambience -> start state, text keywords, speaker tags, sfx, author directives.

    Later rule wins on the same turn: keyword < speaker tag < author directive. A keyboard sfx shows `working` while it plays.
    """
    text_of = scr.get("text", {})
    by_t = {e["turn"]: e for e in entries if "turn" in e}
    state0 = scr.get("by_ambience", {}).get(ambience or "", scr.get("start", "idle"))
    out: list[dict[str, Any]] = [{"state": state0, "t": by_t[turns[0]]["start"], "first": True}]
    for n in turns:
        e, want = by_t[n], None
        for rule in scr.get("by_text", []):
            if re.search(rule["re"], e["text"], re.IGNORECASE):
                want = {"state": rule["state"], **({"text": rule["text"]} if "text" in rule else {})}
                break
        if (st := _pick(scr.get("by_tag", {}), _tags(e["text"]))) is not None:  # how it is said beats what is said: a panicked "all under control" is an error
            want = {"state": st}
        if n in authored:
            want = authored[n]
        if want:
            out.append({"t": e["start"], **want})
    lo, hi = by_t[turns[0]]["start"], by_t[turns[-1]]["end"]
    for e in entries:
        if (st := scr.get("by_sfx", {}).get(e.get("sfx", ""))) and lo <= e["start"] <= hi:
            before = [c for c in out if c["t"] <= e["start"]][-1]["state"]
            out += [{"t": e["start"], "state": st}, {"t": e["end"], "state": before}]
    out.sort(key=lambda c: c["t"])
    for c in out:
        c.setdefault("text", text_of.get(c["state"], ""))
    return out


def emit_sheet(tl: dict[str, Any], layout: dict[str, Any]) -> dict[str, Any]:
    """Default scene sheet from video/layout.json: each voice on screen as its own rig, only in the scenes where it speaks.

    A voice with no entry in layout `cast` must be listed in `offscreen` (the narrator); anything else is an error, so no
    speaker is ever drawn as someone else or silently dropped. Props are always on stage; the screen follows the timeline.
    """
    cast, offscreen = layout.get("cast", {}), set(layout.get("offscreen", ["narrator"]))
    by_t = {e["turn"]: e for e in tl["entries"] if "turn" in e}
    unknown = sorted({e["voice"] for e in by_t.values()} - set(cast) - offscreen)
    if unknown:
        msg = f"voices with no rig in video/layout.json (add a cast entry, or list them under offscreen): {', '.join(unknown)}"
        raise ValueError(msg)
    authored = {c["turn"]: {"state": c["screen"], **({"text": c["text"]} if "text" in c else {})} for c in tl.get("cues", [])}
    scenes: dict[str, Any] = {}
    for s in tl["scenes"]:
        voices = {by_t[n]["voice"] for n in s["turns"]}
        chars = []
        for voice in sorted(voices & set(cast)):
            if cast[voice]["id"] not in {c["id"] for c in chars}:
                chars.append({"voice": voice, **cast[voice]})
        props = layout.get("props", [])
        actors = [{k: v for k, v in x.items() if k not in {"state", "expr", "expr_map", "voice"}} for x in [*props, *chars]]
        cues: list[dict[str, Any]] = []
        for p in props:
            for c in _screen_cues(tl["entries"], s["turns"], authored, layout.get("screen", {}), s.get("ambience")):
                t0 = 0 if c.pop("first", False) else None
                cue = {"actor": p["id"], "channel": "state", "value": c["state"], **({"screen_text": c["text"]} if c["text"] else {})}
                cues.append({"at": 0, **cue} if t0 == 0 else {"abs": c["t"], **cue})
        for ch in chars:
            cues.append({"at": 0, "actor": ch["id"], "channel": "expr", "blend": 0.25, "value": ch.get("expr", "neutral_anxious")})
            for n in s["turns"]:
                e = by_t[n]
                if e["voice"] == ch["voice"] and (x := _pick(ch.get("expr_map", {}), _tags(e["text"]))):
                    cues.append({"turn": n, "actor": ch["id"], "channel": "expr", "value": x})
        ids = {a["id"] for a in actors}
        cam = next((c["viewBox"] for c in layout.get("cameras", []) if set(c.get("actors", [])) <= ids), layout["camera"]["viewBox"])
        bg = layout.get("looks", {}).get(s.get("ambience") or "", layout.get("background", "#26344f"))
        scenes[s["title"]] = {"actors": sorted(actors, key=lambda a: a.get("layer", 0)), "cues": cues, "camera": {"viewBox": cam}, "background": bg}
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
        {"id": f"s{i + 1:02d}", "title": s["title"], "turns": [by_n[n] for n in s["turns"]], "all": tl["entries"]}
        for i, s in enumerate(tl["scenes"])
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


def resolve_scene(group: dict[str, Any], sheet: dict[str, Any], wav: tuple[int, list[float]], assets: Path | None = None) -> dict[str, Any]:
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

    def anchor(c: dict[str, Any]) -> float:
        """Scene-relative seconds of a cue/shot: `at` (scene clock), `abs` (audio clock), `turn` (scenario item) or `entry` (timeline entry), plus `offset`."""
        if "at" in c:
            return c["at"]
        if "abs" in c:
            return max(0.0, rel(c["abs"]))
        if "entry" in c:
            return max(0.0, rel(group["all"][c["entry"]]["start"])) + c.get("offset", 0)
        return turn_start(c["turn"]) + c.get("offset", 0)

    tracks: list[dict[str, Any]] = []
    for c in d.get("cues", []):
        t = anchor(c)
        tr = next((x for x in tracks if x["actor"] == c["actor"] and x["channel"] == c["channel"]), None)
        if tr is None:
            tr = {"actor": c["actor"], "channel": c["channel"], **({"blend": c["blend"]} if "blend" in c else {}), "keys": []}
            tracks.append(tr)
        tr["keys"].append({"t": round(t, 3)} | {k: v for k, v in c.items() if k not in {"at", "abs", "turn", "entry", "offset", "actor", "channel", "blend"}})
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
    if d.get("shots"):
        shots |= shots_v2(d, sheet, group, anchor, assets)
    return {"shots": shots, "mouth": mouth}


def _art(assets: Path | None, kind: str, ident: str) -> str | None:
    """Real art dropped in as <assets>/<kind>/<id>.svg replaces the flat placeholder with the same id; no code change."""
    f = assets / kind / f"{ident}.svg" if assets else None
    return f.read_text() if f and f.exists() else None


def shots_v2(d: dict[str, Any], sheet: dict[str, Any], group: dict[str, Any], anchor: Any, assets: Path | None) -> dict[str, Any]:
    """The shots/2 part of a scene: shot list with times, sets and props used (placeholder or staged art), screens, transitions."""
    shots = []
    for i, sh in enumerate(d["shots"]):
        t0 = 0.0 if i == 0 else round(max(0.0, anchor(sh["at"]) - sh.get("lead", 0.15)), 3)
        shots.append({k: v for k, v in sh.items() if k != "at"} | {"t0": t0})
    if any(b["t0"] <= a["t0"] for a, b in zip(shots, shots[1:], strict=False)):
        msg = f'scene "{group["title"]}": shots are not in time order: {[s["id"] for s in shots]}'
        raise ValueError(msg)
    sets = {k: dict(v) for k, v in sheet.get("sets", {}).items() if k in {s.get("set") or d.get("set") for s in shots} | {s["inset"]["set"] for s in shots if "inset" in s}}
    props = {k: dict(v) for k, v in sheet.get("props", {}).items()}
    for ident, v in {**sets, **props}.items():
        if (svg := _art(assets, "sets" if ident in sets else "props", ident)) is not None:
            v["svg"] = svg
    trans = []
    if (o := d.get("transition_out")) and o["type"] == "time_card":
        trans.append({"type": "time_card", "text": o["text"], "t0": round(group["duration"] - o.get("dur", 1.2), 3), "t1": group["duration"], "fade": o.get("fade", 0.4)})
    if (i := d.get("transition_in")) and i["type"] == "time_card":
        trans.append({"type": "card_out", "text": i["text"], "t0": 0, "t1": i.get("fade", 0.4), "fade": i.get("fade", 0.4)})
    return {"schema": "shots/2", "set": d.get("set"), "shots": shots, "sets": sets, "props": props, "screens": sheet.get("screens", {}), "transitions": trans}


def write_scene(out: Path, scene: dict[str, Any]) -> Path:
    """<out>/<id>/shots.json and mouth_<actor>.json: the whole contract with the renderer."""
    d = out / scene["shots"]["scene"]
    d.mkdir(parents=True, exist_ok=True)
    (d / "shots.json").write_text(json.dumps(scene["shots"], ensure_ascii=False, indent=1))
    for actor, m in scene["mouth"].items():
        (d / f"mouth_{actor}.json").write_text(json.dumps(m))
    return d


def plan(tl: dict[str, Any], sheet: dict[str, Any], audio: Path, out: Path, assets: Path | None = None) -> list[dict[str, Any]]:
    """Every scene of the timeline resolved and written under `out`; returns the groups with their `dir`."""
    wav = read_wav(audio)
    groups = segment(tl, sheet)
    for g in groups:
        g["dir"] = write_scene(out, resolve_scene(g, sheet, wav, assets))
    return groups
