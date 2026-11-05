"""platform_rules and check_policy: what the platform says, and what is still unresolved.

    uv run policy.py init WORLD                  copy the seed rules (contracts/seeds) into the world
    uv run policy.py list WORLD                  every rule: id, confidence, status
    uv run policy.py check WORLD [--stale-days N] [--spec SPEC]
        check_policy, run before publishing: lists every OPEN rule not acknowledged, every rule with
        no source URL or fetched date, and every rule fetched more than N days ago (default 90).
        With --spec, also the distinct check for that episode. Exit 1 while anything is unresolved.

A rule is OPEN until a human resolves it: replace its confidence and status after reading the platform,
or acknowledge it in world.brief `policy.acks` (`{"rule": ID, "decision": TEXT, "date": D}`): a conscious
decision to publish while it is open. An ack never changes the rule.
"""

import datetime as dt
import shutil
import sys
from pathlib import Path
from typing import Any

import contract
import distinct
from contract import OPEN, Finding

STALE_DAYS = 90


def path_of(world: Path) -> Path:
    return world / "platform_rules.json"


def validate(data: dict[str, Any]) -> list[Finding]:
    out: list[Finding] = []
    seen: set[str] = set()
    for r in data.get("rules", []):
        w = r.get("id", "?")
        if w in seen:
            out.append(("error", w, "duplicate id"))
        seen.add(w)
        for k in ("id", "platform", "statement", "confidence", "status"):
            if not isinstance(r.get(k), str) or not r[k]:
                out.append(("error", w, f"missing `{k}`"))
        if not isinstance(r.get("written"), bool):
            out.append(("error", w, "`written` must be true/false"))
        contract.one_of(r.get("confidence"), contract.CONFIDENCE, f"{w}.confidence", out, what="confidence")
        contract.one_of(r.get("status"), ("known", OPEN), f"{w}.status", out, what="status")
        if r.get("confidence") == "FACT" and not r.get("quote"):
            out.append(("error", w, "FACT without a `quote` from the source"))
    return out


def acked(world: Path) -> dict[str, dict[str, Any]]:
    f = world / "world.brief.json"
    if not f.exists():
        return {}
    pol = contract.read_json(f).get("policy")
    acks = pol.get("acks", []) if isinstance(pol, dict) else []
    return {a["rule"]: a for a in acks if isinstance(a, dict) and "rule" in a}


def check_policy(world: Path, *, today: dt.date | None = None, stale_days: int = STALE_DAYS) -> list[Finding]:
    f = path_of(world)
    if not f.exists():
        return [("error", str(f), "no platform_rules.json: run `policy.py init`")]
    data = contract.read_json(f)
    out = validate(data)
    today = today or dt.date.today()
    acks = acked(world)
    for r in data.get("rules", []):
        w = r.get("id", "?")
        if r.get("status") == OPEN or r.get("confidence") == OPEN:
            if w in acks:
                out.append(("warn", w, f"OPEN, acknowledged {acks[w].get('date', '?')}: {acks[w].get('decision', '')}"))
            else:
                out.append(("open", w, f"OPEN, not acknowledged: {r.get('statement')}"))
        if not r.get("source_url") and r.get("status") != OPEN:
            out.append(("warn", w, "no source_url"))
        try:
            age = (today - dt.date.fromisoformat(r["fetched"])).days
            if age > stale_days:
                out.append(("warn", w, f"fetched {age} days ago: re-read the source"))
        except (KeyError, ValueError):
            out.append(("warn", w, "no valid `fetched` date"))
    return out


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] not in ("init", "list", "check"):
        print(__doc__)
        return 2
    cmd, world = argv[1], contract.world_dir(argv[2])
    if cmd == "init":
        if path_of(world).exists():
            sys.exit(f"{path_of(world)} exists")
        shutil.copy(contract.CONTRACTS / "seeds" / "platform_rules.json", path_of(world))
        print(f"[perform] wrote {path_of(world)}")
        return 0
    if cmd == "list":
        for r in contract.read_json(path_of(world))["rules"]:
            print(f"{r['id']:30} {r['confidence']:6} {r['status']:6} {r['statement']}")
        return 0
    days = int(argv[argv.index("--stale-days") + 1]) if "--stale-days" in argv else STALE_DAYS
    findings = check_policy(world, stale_days=days)
    if "--spec" in argv:
        spec = Path(argv[argv.index("--spec") + 1])
        findings += distinct.check_all(world, spec.name)
    ok = contract.report(findings, str(path_of(world)), strict_open=True)
    if not ok:
        print("[perform] check_policy: unresolved; resolve or acknowledge before publishing")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
