"""experiments: tests of hypotheses on our own uploads. PROPOSED -> RUNNING -> COMPLETED.

    uv run experiments.py init WORLD            copy the seed experiments (PROPOSED, no results)
    uv run experiments.py list WORLD [--all] [--status S]    unfinished experiments (default), or all
    uv run experiments.py show WORLD ID         the record and the episodes that reference it
    uv run experiments.py add WORLD ID --hypotheses H[,H] --plan TEXT --metric M[,M]
    uv run experiments.py start WORLD ID [--date D]
    uv run experiments.py result WORLD ID --n N --value TEXT --decision adopt|reject|inconclusive [--note TEXT] [--date D]
    uv run experiments.py check WORLD           validate the ledger

An experiment tests one or more hypotheses (hypotheses.json). A result needs a sample size `--n` (videos)
and a value; the tool computes nothing and invents nothing. `adopt` means the variant won and the
hypothesis is confirmed, `reject` that it lost; `inconclusive` changes nothing. COMPLETED with adopt or
reject is recorded as own evidence on the linked hypotheses and the lifecycle rule runs
(hypotheses.py). Episodes cite experiment ids in their spec (`experiments`): `show` lists them.
"""

import json
import shutil
import sys
from pathlib import Path
from typing import Any

import contract
import hypotheses
from contract import Finding

STATUSES = ("PROPOSED", "RUNNING", "COMPLETED")
DECISIONS = ("adopt", "reject", "inconclusive")


def path_of(world: Path) -> Path:
    return world / "experiments.json"


def load(world: Path) -> dict[str, Any]:
    f = path_of(world)
    if not f.exists():
        sys.exit(f"{f} missing: run `experiments.py init`")
    return contract.read_json(f)


def get(data: dict[str, Any], exp_id: str) -> dict[str, Any]:
    e = next((x for x in data["experiments"] if x["id"] == exp_id), None)
    if e is None:
        sys.exit(f"no experiment {exp_id}")
    return e


def validate(data: dict[str, Any], world: Path | None = None) -> list[Finding]:
    from world import METRICS

    out: list[Finding] = []
    seen: set[str] = set()
    known = (
        {h["id"] for h in contract.read_json(world / "hypotheses.json")["hypotheses"]}
        if world and (world / "hypotheses.json").exists()
        else None
    )
    for i, e in enumerate(data.get("experiments", [])):
        w = e.get("id") or f"experiments[{i}]"
        if w in seen:
            out.append(("error", w, "duplicate id"))
        seen.add(w)
        for k in ("id", "design"):
            if not isinstance(e.get(k), str) or not e[k]:
                out.append(("error", w, f"missing `{k}`"))
        contract.one_of(e.get("status"), STATUSES, f"{w}.status", out, what="status")
        hs = e.get("hypotheses")
        if not isinstance(hs, list) or not hs:
            out.append(("error", w, "`hypotheses` must be a non-empty list"))
        elif known is not None:
            out += [("error", w, f"unknown hypothesis «{h}»") for h in hs if h not in known]
        ms = e.get("metric")
        if not isinstance(ms, list) or not ms:
            out.append(("error", w, "`metric` must be a non-empty list"))
        else:
            for m in ms:
                contract.one_of(m, METRICS, f"{w}.metric", out, what="metric")
        r, st = e.get("result"), e.get("status")
        if st == "COMPLETED" and r is None:
            out.append(("error", w, "COMPLETED without a result"))
        if st != "COMPLETED" and r is not None:
            out.append(("error", w, "a result on an experiment that is not COMPLETED"))
        if r is not None:
            out += [("error", w, f"result lacks `{k}`") for k in ("n", "value", "date") if k not in r]
            contract.one_of(e.get("decision"), DECISIONS, f"{w}.decision", out, what="decision")
        elif e.get("decision") not in (contract.OPEN, None):
            out.append(("error", w, "a decision without a result"))
        if st in ("RUNNING", "COMPLETED") and not e.get("started"):
            out.append(("warn", w, "no `started` date"))
    return out


def referencing(world: Path, exp_id: str) -> list[str]:
    return [
        f.name.removesuffix(".spec.json")
        for f in sorted((world / "episodes").glob("*.spec.json"))
        if exp_id in (contract.read_json(f).get("experiments") or [])
    ]


def list_rows(world: Path, *, only_open: bool = True, status: str | None = None) -> list[dict[str, Any]]:
    rows = load(world)["experiments"]
    return [e for e in rows if (not only_open or e["status"] != "COMPLETED") and (not status or e["status"] == status)]


def start(world: Path, exp_id: str, date: str | None = None) -> dict[str, Any]:
    data = load(world)
    e = get(data, exp_id)
    if e["status"] != "PROPOSED":
        sys.exit(f"{exp_id} is {e['status']}: only a PROPOSED experiment starts")
    e["status"], e["started"] = "RUNNING", date or hypotheses.today()
    contract.write_json(path_of(world), data)
    return e


def record(
    world: Path, exp_id: str, *, n: int, value: str, decision: str, note: str = "", date: str | None = None
) -> tuple[dict[str, Any], list[str]]:
    """Complete an experiment; (record, hypothesis moves). A result is never overwritten."""
    data = load(world)
    e = get(data, exp_id)
    if decision not in DECISIONS:
        sys.exit(f"decision must be one of {', '.join(DECISIONS)}")
    if e["status"] == "COMPLETED":
        sys.exit(f"{exp_id} already has a result; edit the file to amend it")
    day = date or hypotheses.today()
    e["result"] = {"n": n, "value": value, "note": note, "date": day}
    e["decision"], e["completed"], e["status"] = decision, day, "COMPLETED"
    e["started"] = e.get("started") or day
    contract.write_json(path_of(world), data)
    return e, hypotheses.from_experiment(world, e)


def opt(argv: list[str], name: str, default: str | None = None) -> str | None:
    return argv[argv.index(name) + 1] if name in argv else default


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] not in ("init", "list", "show", "add", "start", "result", "check"):
        print(__doc__)
        return 2
    cmd, world = argv[1], contract.world_dir(argv[2])
    if cmd == "init":
        if path_of(world).exists():
            sys.exit(f"{path_of(world)} exists")
        shutil.copy(contract.CONTRACTS / "seeds" / "experiments.json", path_of(world))
        print(f"[perform] wrote {path_of(world)}")
        return 0
    if cmd == "check":
        return 0 if contract.report(validate(load(world), world), str(path_of(world))) else 1
    if cmd == "list":
        rows = list_rows(world, only_open="--all" not in argv, status=opt(argv, "--status"))
        for e in rows:
            print(f"{e['id']:34} {e['status']:9} tests {','.join(e['hypotheses'])}  {','.join(e['metric'])}\n    {e['design']}")
        print(f"[perform] {len(rows)} experiments")
        return 0
    if len(argv) < 4:
        print(__doc__)
        return 2
    exp_id = argv[3]
    if cmd == "show":
        print(json.dumps(get(load(world), exp_id), ensure_ascii=False, indent=2))
        print(f"episodes: {', '.join(referencing(world, exp_id)) or 'none yet'}")
        return 0
    if cmd == "start":
        e = start(world, exp_id, opt(argv, "--date"))
        print(f"[perform] {exp_id}: RUNNING since {e['started']}")
        return 0
    if cmd == "add":
        data = load(world)
        data["experiments"].append(
            {"id": exp_id, "hypotheses": (opt(argv, "--hypotheses") or "").split(",") if opt(argv, "--hypotheses") else [],
             "status": "PROPOSED", "design": opt(argv, "--plan"), "metric": (opt(argv, "--metric") or "").split(","),
             "started": None, "result": None, "decision": contract.OPEN, "completed": None},
        )  # fmt: skip
        findings = validate(data, world)
        if any(f[0] == "error" for f in findings):
            contract.report(findings, str(path_of(world)))
            return 1
        contract.write_json(path_of(world), data)
        hypotheses.link_experiment(world, exp_id, data["experiments"][-1]["hypotheses"])
        print(f"[perform] added {exp_id}")
        return 0
    n, value, decision = opt(argv, "--n"), opt(argv, "--value"), opt(argv, "--decision")
    if not (n and value and decision):
        sys.exit("result needs --n, --value and --decision")
    _, moves = record(world, exp_id, n=int(n), value=value, decision=decision, note=opt(argv, "--note") or "", date=opt(argv, "--date"))
    print(f"[perform] {exp_id}: COMPLETED, {decision}")
    for m in moves:
        print(f"[perform] hypothesis {m}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
