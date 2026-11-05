"""experiments: hypotheses about platform behaviour and format, tracked until tested.

    uv run experiments.py init WORLD            copy the seed hypotheses (contracts/seeds) into the world
    uv run experiments.py list WORLD [--open|--all] [--area A]    open hypotheses (default), or all
    uv run experiments.py show WORLD ID         one hypothesis and the episodes that reference it
    uv run experiments.py add WORLD ID --area A --claim TEXT --plan TEXT --metric M[,M] [--confidence C] [--source TEXT]
    uv run experiments.py result WORLD ID --n N --value TEXT --decision adopt|reject|inconclusive [--note TEXT] [--date D]
    uv run experiments.py check WORLD           validate the ledger

Confidence: FACT (platform doc), 3P (third-party), FOLK (creator wisdom), TESTED (our own result).
A result is recorded only with a sample size `--n` (videos) and a value; the tool computes nothing
and invents nothing. An `adopt` or `reject` decision makes the confidence TESTED. Episodes cite
experiment ids in their spec (`experiments`): `show` lists them, so a result can be traced back.
"""

import datetime as dt
import json
import shutil
import sys
from pathlib import Path
from typing import Any

import contract
from contract import Finding

AREAS = ("hook", "intro", "subtitles", "cover", "length", "cta", "title", "metrics", "audience", "policy", "audio", "other")
DECISIONS = ("adopt", "reject", "inconclusive")


def path_of(world: Path) -> Path:
    return world / "experiments.json"


def load(world: Path) -> dict[str, Any]:
    f = path_of(world)
    if not f.exists():
        sys.exit(f"{f} missing: run `experiments.py init`")
    return contract.read_json(f)


def status(e: dict[str, Any]) -> str:
    return "done" if e.get("result") else "open"


def validate(data: dict[str, Any]) -> list[Finding]:
    from world import METRICS

    out: list[Finding] = []
    seen: set[str] = set()
    for i, e in enumerate(data.get("experiments", [])):
        w = e.get("id") or f"experiments[{i}]"
        if e.get("id") in seen:
            out.append(("error", w, "duplicate id"))
        seen.add(e.get("id", ""))
        for k in ("id", "area", "claim", "test_plan"):
            if not isinstance(e.get(k), str) or not e[k]:
                out.append(("error", w, f"missing `{k}`"))
        contract.one_of(e.get("area"), AREAS, f"{w}.area", out, what="area")
        contract.one_of(
            e.get("confidence"), [c for c in contract.CONFIDENCE if c != contract.OPEN], f"{w}.confidence", out, what="confidence"
        )
        ms = e.get("metric")
        if not isinstance(ms, list) or not ms:
            out.append(("error", w, "`metric` must be a non-empty list"))
        else:
            for m in ms:
                contract.one_of(m, METRICS, f"{w}.metric", out, what="metric")
        if not e.get("source"):
            out.append(("error", w, "missing `source`"))
        r = e.get("result")
        if r is not None:
            for k in ("n", "value", "date"):
                if k not in r:
                    out.append(("error", w, f"result lacks `{k}`"))
            contract.one_of(e.get("decision"), DECISIONS, f"{w}.decision", out, what="decision")
        elif e.get("decision") not in (contract.OPEN, None):
            out.append(("error", w, "a decision without a result"))
        if e.get("confidence") == "TESTED" and r is None:
            out.append(("error", w, "TESTED without a result"))
    return out


def referencing(world: Path, exp_id: str) -> list[str]:
    return [
        f.name.removesuffix(".spec.json")
        for f in sorted((world / "episodes").glob("*.spec.json"))
        if exp_id in (contract.read_json(f).get("experiments") or [])
    ]


def list_rows(world: Path, *, only_open: bool = True, area: str | None = None) -> list[dict[str, Any]]:
    rows = load(world)["experiments"]
    return [e for e in rows if (not only_open or status(e) == "open") and (not area or e["area"] == area)]


def record(world: Path, exp_id: str, *, n: int, value: str, decision: str, note: str = "", date: str | None = None) -> dict[str, Any]:
    data = load(world)
    e = next((x for x in data["experiments"] if x["id"] == exp_id), None)
    if e is None:
        sys.exit(f"no experiment {exp_id}")
    if decision not in DECISIONS:
        sys.exit(f"decision must be one of {', '.join(DECISIONS)}")
    if e.get("result"):
        sys.exit(f"{exp_id} already has a result; edit the file to amend it")
    day = date or dt.date.today().isoformat()
    e["result"] = {"n": n, "value": value, "note": note, "date": day}
    e["decision"], e["decided"] = decision, day
    if decision != "inconclusive":
        e["confidence"] = "TESTED"
    contract.write_json(path_of(world), data)
    return e


def opt(argv: list[str], name: str, default: str | None = None) -> str | None:
    return argv[argv.index(name) + 1] if name in argv else default


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] not in ("init", "list", "show", "add", "result", "check"):
        print(__doc__)
        return 2
    cmd, world = argv[1], contract.world_dir(argv[2])
    if cmd == "init":
        dest = path_of(world)
        if dest.exists():
            sys.exit(f"{dest} exists")
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(contract.CONTRACTS / "seeds" / "experiments.json", dest)
        print(f"[perform] wrote {dest}")
        return 0
    if cmd == "check":
        return 0 if contract.report(validate(load(world)), str(path_of(world))) else 1
    if cmd == "list":
        rows = list_rows(world, only_open="--all" not in argv, area=opt(argv, "--area"))
        for e in rows:
            print(f"{e['id']:28} {status(e):5} {e['confidence']:6} {e['area']:10} {','.join(e['metric'])}\n    {e['claim']}")
        print(f"[perform] {len(rows)} hypotheses")
        return 0
    if len(argv) < 4:
        print(__doc__)
        return 2
    exp_id = argv[3]
    if cmd == "show":
        e = next((x for x in load(world)["experiments"] if x["id"] == exp_id), None)
        if e is None:
            sys.exit(f"no experiment {exp_id}")
        print(json.dumps(e, ensure_ascii=False, indent=2))
        print(f"episodes: {', '.join(referencing(world, exp_id)) or 'none yet'}")
        return 0
    if cmd == "add":
        data = load(world)
        e = {
            "id": exp_id, "area": opt(argv, "--area"), "claim": opt(argv, "--claim"), "confidence": opt(argv, "--confidence", "FOLK"),
            "source": {"note": opt(argv, "--source", "own idea")}, "test_plan": opt(argv, "--plan"),
            "metric": (opt(argv, "--metric") or "").split(","), "result": None, "decision": contract.OPEN, "decided": None,
        }  # fmt: skip
        data["experiments"].append(e)
        findings = validate(data)
        if any(f[0] == "error" for f in findings):
            contract.report(findings, str(path_of(world)))
            return 1
        contract.write_json(path_of(world), data)
        print(f"[perform] added {exp_id}")
        return 0
    n, value, decision = opt(argv, "--n"), opt(argv, "--value"), opt(argv, "--decision")
    if not (n and value and decision):
        sys.exit("result needs --n, --value and --decision")
    e = record(world, exp_id, n=int(n), value=value, decision=decision, note=opt(argv, "--note") or "", date=opt(argv, "--date"))
    print(f"[perform] {exp_id}: {decision}, confidence {e['confidence']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
