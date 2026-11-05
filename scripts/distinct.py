"""Distinctness check: the novelty keys of an episode against the last N episodes of its world.

Guards against «templated storylines», «the same situation over and over with the same outcome»
and «minimal variation across videos». Deterministic, no model: it compares five keys of the
episode.spec: premise key, mechanism, outcome type, main set, title pattern.

    uv run distinct.py WORLD [SPEC]     every episode against the ones before it, or one spec
    uv run distinct.py WORLD --last 5

The ledger is the world's `episodes/*.spec.json`, ordered by `number`. A spec with status
`dropped` is not counted. Limits come from DEFAULTS, overridden by world.brief `policy.distinct`.
"""

import sys
from pathlib import Path
from typing import Any

import contract
from contract import Finding

DEFAULTS = {
    "last_n": 8,  # how many earlier episodes an episode is compared with
    "set_run": 2,  # the same set this many episodes in a row is an error
    "title_pattern_run": 3,  # the same title pattern this many in a row (counting this one) is a warning
    "repeat_warn": 3,  # one mechanism or outcome in this many of the window (counting this one) is a warning
}


def keys(spec: dict[str, Any]) -> dict[str, Any]:
    """The five novelty keys of a spec; a missing or OPEN one is None (never compared)."""

    def val(v: Any) -> Any:
        return None if contract.is_open(v) else v

    return {
        "premise": val((spec.get("premise") or {}).get("key") if isinstance(spec.get("premise"), dict) else None),
        "mechanism": val(spec.get("mechanism")),
        "outcome": val((spec.get("outcome") or {}).get("type") if isinstance(spec.get("outcome"), dict) else None),
        "set": val(spec.get("set")),
        "title_pattern": val((spec.get("title") or {}).get("pattern") if isinstance(spec.get("title"), dict) else None),
    }


def ledger(world: Path) -> list[dict[str, Any]]:
    """Specs of the world in order of `number` (then file name), dropped ones left out."""
    specs = []
    for f in sorted((world / "episodes").glob("*.spec.json")):
        s = contract.read_json(f)
        s["_file"] = f.name
        if s.get("status") != "dropped":
            specs.append(s)
    return sorted(specs, key=lambda s: (s.get("number") if isinstance(s.get("number"), int) else 10**9, s["_file"]))


def limits(world: Path | None) -> dict[str, int]:
    out = dict(DEFAULTS)
    if world and (f := world / "world.brief.json").exists():
        pol = contract.read_json(f).get("policy")
        if isinstance(pol, dict) and isinstance(pol.get("distinct"), dict):
            out |= {k: v for k, v in pol["distinct"].items() if k in DEFAULTS and isinstance(v, int)}
    return out


def name(s: dict[str, Any]) -> str:
    return s.get("slug") or s["_file"]


def compare(spec: dict[str, Any], before: list[dict[str, Any]], lim: dict[str, int] | None = None) -> list[Finding]:
    """Collisions of `spec` with `before` (earlier episodes, oldest first)."""
    lim = lim or DEFAULTS
    window = before[-lim["last_n"] :]
    me, out = keys(spec), []
    where = name(spec)
    if not window:
        return out
    for ep in window:
        other = keys(ep)
        if me["mechanism"] and me["outcome"] and (me["mechanism"], me["outcome"]) == (other["mechanism"], other["outcome"]):
            out.append(
                (
                    "error",
                    where,
                    f"same mechanism «{me['mechanism']}» and outcome «{me['outcome']}» as {name(ep)}: same situation, same outcome",
                )
            )
        elif me["premise"] and me["premise"] == other["premise"]:
            out.append(("error", where, f"same premise key «{me['premise']}» as {name(ep)}"))
    out += _run(me, window, "set", lim["set_run"], "error", where, "the same set")
    out += _run(me, window, "title_pattern", lim["title_pattern_run"], "warn", where, "the same title pattern")
    for key in ("mechanism", "outcome"):
        if me[key] and 1 + sum(keys(e)[key] == me[key] for e in window) >= lim["repeat_warn"]:
            n = 1 + sum(keys(e)[key] == me[key] for e in window)
            out.append(("warn", where, f"{key} «{me[key]}» in {n} of the last {len(window) + 1} episodes: minimal variation"))
    shared = [k for k, v in me.items() if v is not None and window and v == keys(window[-1])[k]]
    if len(shared) >= 4:
        out.append(
            ("error", where, f"shares {len(shared)} of 5 novelty keys ({', '.join(shared)}) with the previous episode {name(window[-1])}")
        )
    return out


def _run(me: dict[str, Any], window: list[dict[str, Any]], key: str, run: int, level: str, where: str, what: str) -> list[Finding]:
    """`what` in the last `run` episodes in a row, this one counted."""
    if not me[key] or run < 2 or len(window) < run - 1:
        return []
    tail = window[-(run - 1) :]
    if all(keys(e)[key] == me[key] for e in tail):
        return [(level, where, f"{what} «{me[key]}» {run} episodes in a row ({', '.join(name(e) for e in tail)}, this one)")]
    return []


def check_all(world: Path, spec_file: str | None = None, last: int | None = None) -> list[Finding]:
    eps = ledger(world)
    lim = limits(world)
    if last:
        lim["last_n"] = last
    out: list[Finding] = []
    for i, ep in enumerate(eps):
        if spec_file and ep["_file"] != Path(spec_file).name:
            continue
        out += compare(ep, eps[:i], lim)
    return out


def main(argv: list[str]) -> int:
    args = [a for a in argv[1:] if not a.startswith("--")]
    last = int(argv[argv.index("--last") + 1]) if "--last" in argv else None
    if last is not None:
        args = [a for a in args if a != str(last)]
    if not args:
        print(__doc__)
        return 2
    world = contract.world_dir(args[0])
    findings = check_all(world, args[1] if len(args) > 1 else None, last)
    return 0 if contract.report(findings, str(world / "episodes")) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
