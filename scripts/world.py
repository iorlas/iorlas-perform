"""world.brief: what a world is for. One file per world, written by a human, validated here.

    uv run world.py new WORLD      write <world>/world.brief.json with every field OPEN
    uv run world.py check WORLD    validate; list the OPEN fields (never invents a value)

The brief names the platforms and format profiles (contracts/formats.json), the audience,
genre and tone, the cadence, policy constraints and the success metrics. Episode specs and the
distinct check read it; see docs/contracts/world-brief.md.
"""

import sys
from typing import Any

import contract
from contract import OPEN, Finding

METRICS = (
    "viewed_vs_swiped", "retention_3s", "retention_10s", "retention_end", "avg_view_duration",
    "avg_view_pct", "engaged_views", "ctr", "comments_per_view", "subscribers_per_view", "studio_policy_notice",
)  # fmt: skip

TEMPLATE: dict[str, Any] = {
    "schema": "world.brief/1",
    "world": OPEN,
    "platforms": OPEN,
    "formats": OPEN,
    "length_s": OPEN,
    "audience": OPEN,
    "genre": OPEN,
    "tone": OPEN,
    "cadence": OPEN,
    "policy": OPEN,
    "metrics": OPEN,
}


def validate(brief: dict[str, Any], world: Any = None) -> list[Finding]:
    out: list[Finding] = []
    if brief.get("schema") != "world.brief/1":
        out.append(("error", "schema", "expected world.brief/1"))
    contract.need(brief, "world", str, "", out)
    contract.need(brief, "platforms", list, "", out)
    known = contract.formats(world)
    ids = contract.need(brief, "formats", list, "", out) or []
    for i, f in enumerate(ids):
        contract.one_of(f, known, f"formats[{i}]", out, what="format")
    if (length := contract.need(brief, "length_s", dict, "", out)) is not None:
        lo = contract.need(length, "min", (int, float), "length_s", out)
        hi = contract.need(length, "max", (int, float), "length_s", out)
        if lo is not None and hi is not None and lo > hi:
            out.append(("error", "length_s", "min above max"))
        for f in ids:
            if f in known and hi is not None and hi > known[f]["hard_max_s"]:
                out.append(("warn", "length_s", f"max {hi} s is above {f}'s hard max {known[f]['hard_max_s']} s"))
    if (aud := contract.need(brief, "audience", dict, "", out)) is not None:
        contract.need(aud, "language", str, "audience", out)
        contract.need(aud, "who", str, "audience", out)
    contract.need(brief, "genre", str, "", out)
    contract.need(brief, "tone", str, "", out)
    if (cad := contract.need(brief, "cadence", dict, "", out)) is not None:
        contract.need(cad, "per_week", (int, float), "cadence", out)
    if (pol := contract.need(brief, "policy", dict, "", out)) is not None:
        contract.need(pol, "constraints", list, "policy", out)
        for k in ("acks", "distinct"):
            if k in pol and not isinstance(pol[k], (list, dict)):
                out.append(("error", f"policy.{k}", "expected list/object"))
    if (m := contract.need(brief, "metrics", dict, "", out)) is not None:
        prim = contract.need(m, "primary", str, "metrics", out)
        contract.one_of(prim, METRICS, "metrics.primary", out, what="metric")
        for i, s in enumerate(m.get("secondary", [])):
            contract.one_of(s, METRICS, f"metrics.secondary[{i}]", out, what="metric")
    return out


def main(argv: list[str]) -> int:
    if len(argv) != 3 or argv[1] not in ("new", "check"):
        print(__doc__)
        return 2
    world = contract.world_dir(argv[2])
    f = world / "world.brief.json"
    if argv[1] == "new":
        if f.exists():
            sys.exit(f"{f} exists")
        contract.write_json(f, TEMPLATE | {"world": world.name})
        print(f"[perform] wrote {f}: every other field is OPEN")
        return 0
    if not f.exists():
        sys.exit(f"{f} missing: run `world.py new`")
    findings = validate(contract.read_json(f), world)
    return 0 if contract.report(findings, str(f)) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
