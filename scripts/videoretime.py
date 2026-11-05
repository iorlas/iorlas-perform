"""Retime: the estimated timeline replaced by the real one after the audio render; what changed, and what must render again.

Two plans are built from the same script and design, one on the estimate, one on the real timeline (scene.py's <out>.timeline.json).
The report lists shots whose duration moved by more than `tol` (fraction), scenes whose resolved shots.json differs (the only ones
the engine will re-render: scene cache keys hash shots.json), and the gate findings that appeared or went away with real timing.
"""

import json
from pathlib import Path
from typing import Any

import scenario
import videoestimate
import videogates
import videopreprod


def real_entries(real: list[dict[str, Any]], sc: scenario.Scenario, hybrid: bool) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """The real timeline as entries for this script. Exact: every turn matches by number, voice and text, or it is an error (the audio is of another script).
    Hybrid: real seconds where (voice, text) match, estimates elsewhere: what a cache-aware render of an edited script produces."""
    items = {n: it for n, it in enumerate(sc.items, 1)}
    bad = [e["turn"] for e in real if "turn" in e and not (isinstance(items.get(e["turn"]), scenario.Turn) and items[e["turn"]].voice == e["voice"] and videopreprod._norm(items[e["turn"]].text) == videopreprod._norm(e["text"]))]  # noqa: SLF001
    n_turns = sum(isinstance(i, scenario.Turn) for i in sc.items)
    exact = not bad and sum("turn" in e for e in real) == n_turns
    if exact:
        return real, {"mode": "exact", "matched": n_turns, "turns": n_turns}
    if not hybrid:
        msg = f"the real timeline is not of this script: {len(bad)} of its turns differ, it has {sum('turn' in e for e in real)} turns against the script's {n_turns}; pass --hybrid to use real seconds only where a line is unchanged"
        raise ValueError(msg)
    known = videoestimate.from_render(real, sc)
    return videoestimate.estimate(sc, known=known), {"mode": "hybrid", "matched": sum(isinstance(sc.items[n - 1], scenario.Turn) for n in known), "turns": n_turns}


def retime(src: Path, real_timeline: Path, out: Path, *, design: Path | None = None, layout: Path | None = None, fmt: dict[str, Any] | None = None, tol: float = 0.15, hybrid: bool = False) -> dict[str, Any]:
    est = videopreprod.prepare(src, out / "est", design=design, layout=layout, fmt=fmt)
    sc = est["sc"]
    entries, how = real_entries(json.loads(real_timeline.read_text()), sc, hybrid)
    real = videopreprod.prepare(src, out / "real", design=design, layout=layout, fmt=fmt, entries=entries)
    if est["fatal"] or real["fatal"]:
        msg = f"design fails: {est['fatal'] or real['fatal']}"
        raise ValueError(msg)
    shots_rows, scene_rows = [], []
    for ge, gr in zip(est["groups"], real["groups"], strict=True):
        se, sr_ = est["shots"][ge["id"]], real["shots"][gr["id"]]
        for (a, a0, a1), (b, b0, b1) in zip(videopreprod.shot_spans(se), videopreprod.shot_spans(sr_), strict=True):
            d_est, d_real = a1 - a0, b1 - b0
            change = (d_real - d_est) / d_est if d_est else 0.0
            shots_rows.append({"scene": ge["id"], "shot": a["id"], "est_s": round(d_est, 2), "real_s": round(d_real, 2), "change": round(change, 3), "flag": abs(change) > tol})
        changed = videopreprod.digest(se) != videopreprod.digest(sr_)
        scene_rows.append({"scene": ge["id"], "title": se["title"], "est_s": round(se["duration"], 1), "real_s": round(sr_["duration"], 1), "rerender": changed})
    f_est = {_key(f): f for f in videogates.run(est)}
    f_real = {_key(f): f for f in videogates.run(real)}
    return {
        "mode": how, "tolerance": tol, "estimated_total_s": round(est["duration"], 1), "real_total_s": round(real["duration"], 1),
        "error_pct": round((est["duration"] - real["duration"]) / real["duration"] * 100, 1),
        "shots": shots_rows, "flagged": [r for r in shots_rows if r["flag"]], "scenes": scene_rows,
        "rerender": [r["scene"] for r in scene_rows if r["rerender"]], "unchanged": [r["scene"] for r in scene_rows if not r["rerender"]],
        "gates_new": [f_real[k] for k in f_real if k not in f_est], "gates_gone": [f_est[k] for k in f_est if k not in f_real],
        "gates_real": list(f_real.values()),
    }


def _key(f: dict[str, Any]) -> tuple[str, str, str, str]:
    """A finding identity that survives small timing shifts: gate, scene, shot, message without its numbers."""
    import re  # noqa: PLC0415

    return (f["gate"], f["scene"], f["shot"], re.sub(r"[\d.]+", "#", f["message"]))


def markdown(r: dict[str, Any]) -> str:
    out = [f"# Retime ({r['mode']['mode']}, {r['mode']['matched']}/{r['mode']['turns']} turns on real seconds)", "",
           f"estimated {r['estimated_total_s']}s · real {r['real_total_s']}s · estimate error {r['error_pct']:+.1f}%", "",
           "| scene | est s | real s | re-render |", "|---|---|---|---|"]
    out += [f"| {s['scene']} {s['title']} | {s['est_s']} | {s['real_s']} | {'yes' if s['rerender'] else 'no (cached)'} |" for s in r["scenes"]]
    out += ["", f"## Shots moved by more than {r['tolerance']:.0%} ({len(r['flagged'])} of {len(r['shots'])})", "", "| shot | est s | real s | change |", "|---|---|---|---|"]
    out += [f"| {s['scene']}/{s['shot']} | {s['est_s']} | {s['real_s']} | {s['change']:+.0%} |" for s in r["flagged"]]
    out += ["", f"## Gates with real timing: {len(r['gates_new'])} new, {len(r['gates_gone'])} gone", ""]
    out += [f"- NEW [{f['severity']}] {f['gate']} {f['scene']} {f['shot']}: {f['message']}" for f in r["gates_new"]]
    out += [f"- gone [{f['severity']}] {f['gate']} {f['scene']} {f['shot']}: {f['message']}" for f in r["gates_gone"]]
    return "\n".join(out)
