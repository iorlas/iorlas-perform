"""hypotheses: claims about platform behaviour and format, with evidence and a lifecycle.

    uv run hypotheses.py init WORLD                     copy the seed hypotheses and sources into the world
    uv run hypotheses.py list WORLD [--status S] [--area A]
    uv run hypotheses.py show WORLD ID
    uv run hypotheses.py add WORLD ID --claim T --area A [--confidence low|medium|high] [--bias STRATEGIC,3P,FOLK,FACT,OWN]
    uv run hypotheses.py add-evidence WORLD ID --stance for|against --attribution WHO --date D [--url U] [--bias B] [--note T] [--strong]
    uv run hypotheses.py promote WORLD ID|--all [--dry-run]   apply the lifecycle rule
    uv run hypotheses.py demote WORLD ID --to STATUS --reason T
    uv run hypotheses.py refresh WORLD                  the refresh checklist and the sources that are due
    uv run hypotheses.py scanned WORLD SOURCE_ID [--date D]
    uv run hypotheses.py export WORLD [--out FILE]      flat markdown table (for a2kay or a human)
    uv run hypotheses.py import WORLD FILE.md           add the rows of such a table; existing ids are kept

Lifecycle (the a2kay research R037, `research/youtube-algorithm-research-optimization`):

    ACTIVE -> SUPPORTED -> VALIDATED          ACTIVE|SUPPORTED|VALIDATED -> CONTRADICTED -> INVALIDATED

- ACTIVE -> SUPPORTED: 3 or more `for` evidence points with distinct attributions, at least one of them
  not STRATEGIC (the platform's own statements weigh least); or one of our own experiments confirmed it.
- SUPPORTED -> VALIDATED: a linked experiment is COMPLETED with decision `adopt` (our own data confirms).
- -> CONTRADICTED: a `strong` `against` point; or 2 or more `against` attributions and more than `for`;
  or a linked experiment COMPLETED with `reject`.
- CONTRADICTED -> INVALIDATED: our own data refutes it: a linked experiment COMPLETED with `reject` when the
  contradiction came from evidence, or a second rejecting experiment when the first one caused it.
- `demote` goes back one step with a reason. Evidence is never removed; every move is kept in `history`.

Source bias: STRATEGIC (the platform's own statements: credible, strategically biased, weigh least), 3P
(independent third party), FOLK (belief without a source), FACT (a primary page read), OWN (our own data,
weighs most). `confidence` (low, medium, high) is the strength of the evidence, not of any one source.
a2kay is an optional backend: this file works without it; see docs/contracts/hypotheses.md.
"""

import datetime as dt
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import contract
from contract import Finding

STATUSES = ("ACTIVE", "SUPPORTED", "VALIDATED", "CONTRADICTED", "INVALIDATED")
BIASES = ("STRATEGIC", "3P", "FOLK", "FACT", "OWN")
STRENGTH = ("low", "medium", "high")
STANCES = ("for", "against")
AREAS = ("hook", "intro", "subtitles", "cover", "length", "cta", "title", "metrics", "audience", "policy", "audio", "other")
BACK = {"SUPPORTED": "ACTIVE", "VALIDATED": "SUPPORTED", "CONTRADICTED": "ACTIVE", "INVALIDATED": "CONTRADICTED"}
SUPPORT_POINTS = 3
CONTRADICT_POINTS = 2
REJECTED = "own experiment rejected it"


def path_of(world: Path) -> Path:
    return world / "hypotheses.json"


def load(world: Path) -> dict[str, Any]:
    f = path_of(world)
    if not f.exists():
        sys.exit(f"{f} missing: run `hypotheses.py init`")
    return contract.read_json(f)


def get(data: dict[str, Any], hid: str) -> dict[str, Any]:
    h = next((x for x in data["hypotheses"] if x["id"] == hid), None)
    if h is None:
        sys.exit(f"no hypothesis {hid}")
    return h


def today() -> str:
    return dt.date.today().isoformat()


def validate(data: dict[str, Any]) -> list[Finding]:
    out: list[Finding] = []
    seen: set[str] = set()
    for i, h in enumerate(data.get("hypotheses", [])):
        w = h.get("id") or f"hypotheses[{i}]"
        if w in seen:
            out.append(("error", w, "duplicate id"))
        seen.add(w)
        for k in ("id", "claim"):
            if not isinstance(h.get(k), str) or not h[k]:
                out.append(("error", w, f"missing `{k}`"))
        contract.one_of(h.get("area"), AREAS, f"{w}.area", out, what="area")
        contract.one_of(h.get("status"), STATUSES, f"{w}.status", out, what="status")
        contract.one_of(h.get("confidence"), STRENGTH, f"{w}.confidence", out, what="confidence")
        biases = h.get("source_bias")
        if not isinstance(biases, list) or not biases:
            out.append(("error", w, "`source_bias` must be a non-empty list"))
        else:
            for b in biases:
                contract.one_of(b, BIASES, f"{w}.source_bias", out, what="source bias")
        for j, ev in enumerate(h.get("evidence", [])):
            ew = f"{w}.evidence[{j}]"
            contract.one_of(ev.get("stance"), STANCES, ew, out, what="stance")
            contract.one_of(ev.get("bias"), BIASES, ew, out, what="source bias")
            for k in ("date", "attribution"):
                if not ev.get(k):
                    out.append(("error", ew, f"missing `{k}`"))
            if ev.get("date") and not re.fullmatch(r"\d{4}-\d\d-\d\d", ev["date"]):
                out.append(("error", ew, "date must be YYYY-MM-DD"))
            if not ev.get("url") and not ev.get("note"):
                out.append(("warn", ew, "no url and no note: nothing to check the point against"))
        if h.get("status") in ("VALIDATED", "INVALIDATED") and not h.get("experiments"):
            out.append(("error", w, f"{h['status']} without a linked experiment"))
    return out


def points(h: dict[str, Any], stance: str) -> tuple[int, int]:
    """(distinct attributions, of those not STRATEGIC) for one stance."""
    ev = [e for e in h.get("evidence", []) if e["stance"] == stance]
    return len({e["attribution"] for e in ev}), len({e["attribution"] for e in ev if e.get("bias") != "STRATEGIC"})


def own_count(h: dict[str, Any], exps: dict[str, dict[str, Any]], decision: str) -> int:
    return sum(exps.get(x, {}).get("status") == "COMPLETED" and exps[x].get("decision") == decision for x in h.get("experiments", []))


def next_status(h: dict[str, Any], exps: dict[str, dict[str, Any]]) -> tuple[str, str] | None:
    """One lifecycle step the evidence now allows: (new status, why), or None."""
    st = h["status"]
    pro, pro_free = points(h, "for")
    con, _ = points(h, "against")
    strong = any(e["stance"] == "against" and e.get("strong") for e in h.get("evidence", []))
    rejects, confirmed = own_count(h, exps, "reject"), own_count(h, exps, "adopt") > 0
    refuted = rejects > 0
    if st == "CONTRADICTED":
        by_us = bool(h.get("history")) and h["history"][-1]["why"] == REJECTED
        return ("INVALIDATED", "own experiments rejected it twice" if by_us else REJECTED) if rejects >= (2 if by_us else 1) else None
    if st == "INVALIDATED":
        return None
    if refuted:
        return "CONTRADICTED", REJECTED
    if strong or (con >= CONTRADICT_POINTS and con > pro):
        return "CONTRADICTED", f"{con} against ({'strong' if strong else 'more than for'})"
    if st == "ACTIVE" and ((pro >= SUPPORT_POINTS and pro_free >= 1) or confirmed):
        return "SUPPORTED", "own experiment confirmed it" if confirmed else f"{pro} independent points for"
    if st == "SUPPORTED" and confirmed:
        return "VALIDATED", "own experiment confirmed it"
    return None


def promote(
    h: dict[str, Any], exps: dict[str, dict[str, Any]], *, apply: bool = True, date: str | None = None
) -> list[tuple[str, str, str]]:
    """Apply the lifecycle rule until it settles; (from, to, why) per step. Nothing changes with apply=False."""
    moves: list[tuple[str, str, str]] = []
    probe = {**h, "history": list(h.get("history", []))}
    while step := next_status(probe, exps):
        moves.append((probe["status"], step[0], step[1]))
        probe["status"] = step[0]
        probe["history"].append({"why": step[1]})
    if apply and moves:
        h["status"] = probe["status"]
        h.setdefault("history", []).extend({"date": date or today(), "from": a, "to": b, "why": why} for a, b, why in moves)
    return moves


def add_evidence(h: dict[str, Any], ev: dict[str, Any]) -> None:
    h.setdefault("evidence", []).append(ev)


def experiments_by_id(world: Path) -> dict[str, dict[str, Any]]:
    f = world / "experiments.json"
    return {e["id"]: e for e in contract.read_json(f).get("experiments", [])} if f.exists() else {}


def from_experiment(world: Path, exp: dict[str, Any]) -> list[str]:
    """Record a COMPLETED experiment's result as own evidence on the hypotheses it tests; apply the rule. Messages."""
    if exp.get("decision") not in ("adopt", "reject") or not (world / "hypotheses.json").exists():
        return []
    data, exps, msgs = load(world), experiments_by_id(world), []
    exps[exp["id"]] = exp
    for hid in exp.get("hypotheses", []):
        h = next((x for x in data["hypotheses"] if x["id"] == hid), None)
        if h is None:
            continue
        r = exp["result"]
        add_evidence(
            h,
            {"date": r["date"], "stance": "for" if exp["decision"] == "adopt" else "against", "attribution": f"own experiment {exp['id']}",
             "url": "", "bias": "OWN", "strong": exp["decision"] == "reject", "note": f"n={r['n']}: {r['value']}"},
        )  # fmt: skip
        msgs += [f"{hid}: {a} -> {b} ({why})" for a, b, why in promote(h, exps, date=r["date"])]
    contract.write_json(path_of(world), data)
    return msgs


def link_experiment(world: Path, exp_id: str, hids: list[str]) -> None:
    """List an experiment on the hypotheses it tests, so the lifecycle rule sees its result."""
    if not (world / "hypotheses.json").exists():
        return
    data = load(world)
    for h in data["hypotheses"]:
        if h["id"] in hids and exp_id not in h.setdefault("experiments", []):
            h["experiments"].append(exp_id)
    contract.write_json(path_of(world), data)


# --- sources and refresh ------------------------------------------------------------------------


def due(world: Path, *, now: dt.date | None = None) -> list[dict[str, Any]]:
    f = world / "sources.json"
    if not f.exists():
        sys.exit(f"{f} missing: run `hypotheses.py init`")
    now = now or dt.date.today()
    out = []
    for s in contract.read_json(f)["sources"]:
        last = s.get("last_scanned")
        age = (now - dt.date.fromisoformat(last)).days if last else None
        if age is None or age >= s["cadence_days"]:
            out.append({**s, "age_days": age})
    return out


def mark_scanned(world: Path, sid: str, date: str | None = None) -> None:
    f = world / "sources.json"
    data = contract.read_json(f)
    s = next((x for x in data["sources"] if x["id"] == sid), None)
    if s is None:
        sys.exit(f"no source {sid}")
    s["last_scanned"] = date or today()
    contract.write_json(f, data)


# --- export / import ----------------------------------------------------------------------------

HEAD = "| id | claim | confidence | source-bias | status | a2kay ref | tests |"
STATUS_IN = {"open": "ACTIVE", "supported": "SUPPORTED", "contested": "ACTIVE", "validated": "VALIDATED", "invalidated": "INVALIDATED"}
BIAS_WORD = re.compile(r"STRATEGIC|3P|FOLK|FACT|OWN")


def export_md(data: dict[str, Any]) -> str:
    rows = [HEAD, "|---|---|---|---|---|---|---|"]
    for h in data["hypotheses"]:
        ref = (h.get("refs") or {}).get("a2kay", "")
        tests = ", ".join(h.get("experiments", []))
        rows.append(f"| {h['id']} | {h['claim']} | {h['confidence']} | {'/'.join(h['source_bias'])} | {h['status']} | {ref} | {tests} |")
    return (
        "# Hypotheses export\n\n"
        f"Exported {today()}. Status follows the lifecycle ACTIVE, SUPPORTED, VALIDATED, CONTRADICTED, INVALIDATED. "
        "Evidence entries are not in this table; they stay in hypotheses.json.\n\n" + "\n".join(rows) + "\n"
    )


def import_md(text: str, data: dict[str, Any], *, area: str = "other") -> tuple[list[str], list[str]]:
    """Add the rows of an exported table whose id is new. (added, kept)."""
    added, kept = [], []
    have = {h["id"] for h in data["hypotheses"]}
    for line in text.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not line.startswith("|") or len(cells) < 6 or cells[0] in ("id", "") or set(cells[0]) <= set("-: "):
            continue
        hid, claim, conf, bias, status, ref = cells[:6]
        if hid in have:
            kept.append(hid)
            continue
        biases = list(dict.fromkeys(BIAS_WORD.findall(bias))) or ["FOLK"]
        tests = [t.strip() for t in cells[6].split(",")] if len(cells) > 6 else []
        data["hypotheses"].append(
            {"id": hid, "claim": claim, "area": area, "status": STATUS_IN.get(status.lower(), status if status in STATUSES else "ACTIVE"),
             "confidence": conf if conf in STRENGTH else "low", "source_bias": biases, "origin": {"note": "imported"}, "evidence": [],
             "experiments": [], "refs": {k: v for k, v in (("a2kay", ref), ("a2kay_tests", ", ".join(tests))) if v}, "history": [],
             **({"note": "contested in the source"} if status.lower() == "contested" else {})},
        )  # fmt: skip
        added.append(hid)
    return added, kept


# --- cli ----------------------------------------------------------------------------------------


def opt(argv: list[str], name: str, default: str | None = None) -> str | None:
    return argv[argv.index(name) + 1] if name in argv else default


def positional(argv: list[str], n: int) -> list[str]:
    flags_with_value = {
        "--status",
        "--area",
        "--claim",
        "--confidence",
        "--bias",
        "--stance",
        "--attribution",
        "--date",
        "--url",
        "--note",
        "--to",
        "--reason",
        "--out",
    }
    return [a for i, a in enumerate(argv[2:], 2) if not a.startswith("--") and argv[i - 1] not in flags_with_value][:n]


def main(argv: list[str]) -> int:
    cmds = ("init", "list", "show", "add", "add-evidence", "promote", "demote", "refresh", "scanned", "export", "import", "check")
    if len(argv) < 3 or argv[1] not in cmds:
        print(__doc__)
        return 2
    cmd, world = argv[1], contract.world_dir(argv[2])
    if cmd == "init":
        for name in ("hypotheses.json", "sources.json"):
            if (world / name).exists():
                sys.exit(f"{world / name} exists")
        for name in ("hypotheses.json", "sources.json"):
            shutil.copy(contract.CONTRACTS / "seeds" / name, world / name)
        print(f"[perform] wrote hypotheses.json and sources.json in {world}")
        return 0
    if cmd == "refresh":
        src = contract.read_json(world / "sources.json")
        for s in src["steps"]:
            print(f"{s['step']}. {s['do']}")
        rows = due(world)
        for s in rows:
            print(f"DUE {s['id']:24} {s['kind']:9} last {s.get('last_scanned') or 'never'}: {s['how_to_scan']}")
        print(f"[perform] {len(rows)} sources due")
        return 0
    if cmd == "scanned":
        mark_scanned(world, positional(argv, 2)[1], opt(argv, "--date"))
        return 0
    data = load(world)
    exps = experiments_by_id(world)
    if cmd == "check":
        return 0 if contract.report(validate(data), str(path_of(world))) else 1
    if cmd == "list":
        status, area = opt(argv, "--status"), opt(argv, "--area")
        rows = [h for h in data["hypotheses"] if (not status or h["status"] == status) and (not area or h["area"] == area)]
        for h in rows:
            f, a = points(h, "for")[0], points(h, "against")[0]
            print(f"{h['id']:28} {h['status']:12} {h['confidence']:6} {'/'.join(h['source_bias']):12} +{f} -{a}\n    {h['claim']}")
        print(f"[perform] {len(rows)} hypotheses")
        return 0
    if cmd == "export":
        text = export_md(data)
        if out := opt(argv, "--out"):
            Path(out).write_text(text)
            print(f"[perform] wrote {out}")
        else:
            print(text)
        return 0
    if cmd == "import":
        added, kept = import_md(Path(positional(argv, 2)[1]).read_text(), data, area=opt(argv, "--area") or "other")
        contract.write_json(path_of(world), data)
        print(f"[perform] imported {len(added)}, kept {len(kept)} existing")
        return 0
    if cmd == "promote" and "--all" in argv:
        changed = 0
        for h in data["hypotheses"]:
            for a, b, why in promote(h, exps, apply="--dry-run" not in argv):
                print(f"{h['id']}: {a} -> {b} ({why})")
                changed += 1
        if "--dry-run" not in argv:
            contract.write_json(path_of(world), data)
        print(f"[perform] {changed} moves")
        return 0
    return one(cmd, argv, world, data, exps)


def one(cmd: str, argv: list[str], world: Path, data: dict[str, Any], exps: dict[str, dict[str, Any]]) -> int:
    pos = positional(argv, 2)
    if len(pos) < 2:
        print(__doc__)
        return 2
    hid = pos[1]
    if cmd == "add":
        data["hypotheses"].append(
            {"id": hid, "claim": opt(argv, "--claim"), "area": opt(argv, "--area"), "status": "ACTIVE",
             "confidence": opt(argv, "--confidence", "low"), "source_bias": (opt(argv, "--bias") or "FOLK").split(","),
             "origin": {"note": "added by hand"}, "evidence": [], "experiments": [],
             "refs": {}, "history": []},
        )  # fmt: skip
        if errs := [f for f in validate(data) if f[0] == "error"]:
            contract.report(errs, str(path_of(world)))
            return 1
        contract.write_json(path_of(world), data)
        return 0
    h = get(data, hid)
    if cmd == "show":
        import json

        print(json.dumps(h, ensure_ascii=False, indent=2))
        return 0
    if cmd == "add-evidence":
        ev = {"date": opt(argv, "--date", today()), "stance": opt(argv, "--stance"), "attribution": opt(argv, "--attribution"),
              "url": opt(argv, "--url", ""), "bias": opt(argv, "--bias", "3P"), "note": opt(argv, "--note", ""),
              "strong": "--strong" in argv}  # fmt: skip
        add_evidence(h, ev)
        if errs := [f for f in validate(data) if f[0] == "error"]:
            contract.report(errs, str(path_of(world)))
            return 1
        contract.write_json(path_of(world), data)
        print(f"[perform] {hid}: +{points(h, 'for')[0]} -{points(h, 'against')[0]} (distinct attributions); `promote` applies the rule")
        return 0
    if cmd == "promote":
        moves = promote(h, exps, apply="--dry-run" not in argv)
        for a, b, why in moves:
            print(f"{hid}: {a} -> {b} ({why})")
        if moves and "--dry-run" not in argv:
            contract.write_json(path_of(world), data)
        print(f"[perform] {hid}: {h['status']}" + ("" if moves else " (no move)"))
        return 0
    # demote
    to, reason = opt(argv, "--to"), opt(argv, "--reason")
    if not reason or BACK.get(h["status"]) != to:
        sys.exit(f"demote {h['status']} goes back to {BACK.get(h['status'], 'nowhere')} and needs --reason")
    h.setdefault("history", []).append({"date": today(), "from": h["status"], "to": to, "why": f"demoted: {reason}"})
    h["status"] = to
    contract.write_json(path_of(world), data)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
