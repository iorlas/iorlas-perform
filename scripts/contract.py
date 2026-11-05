"""Data contracts: shared helpers for world.brief, episode.spec, experiments and platform_rules.

Everything here is world-agnostic. Universal data (format profiles, hook patterns, structure
templates, seeds) lives in <repo>/contracts; a world's own files live in its profile folder:

    <world>/world.brief.json      world.py
    <world>/episodes/*.spec.json  episode.py (the ledger of episodes: distinct.py reads it)
    <world>/experiments.json      experiments.py
    <world>/platform_rules.json   policy.py
    <world>/formats.json, hooks.json   optional: a world's own formats and hook ids

A field a human has not decided holds the string "OPEN". A validator lists OPEN fields and
never fills one in.
"""

import json
import sys
from collections.abc import Iterator
from pathlib import Path
from typing import Any

OPEN = "OPEN"
CONFIDENCE = ("FACT", "3P", "FOLK", "JUDGE", "TESTED", OPEN)
Finding = tuple[str, str, str]  # (level, where, message); level "error", "warn" or "open"

ROOT = Path(__file__).resolve().parent.parent
CONTRACTS = ROOT / "contracts"


def is_open(value: Any) -> bool:
    return value == OPEN or value is None or value in ("", [], {})


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as e:
        sys.exit(f"{path}: {e}")


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def world_dir(arg: str | Path | None) -> Path:
    """A world folder: a path, or the name of a profile; exits when there is none."""
    import profiles

    if arg is None:
        sys.exit("no world: pass --world NAME|PATH")
    p = Path(arg).expanduser()
    if p.is_dir():
        return p
    if prof := profiles.find(str(arg)):
        return prof
    sys.exit(f"no world {arg}: not a folder and not a profile")


def merged(world: Path | None, name: str, key: str) -> dict[str, Any]:
    """contracts/<name>.json[key] with the world's <name>.json[key] on top."""
    out: dict[str, Any] = dict(read_json(CONTRACTS / f"{name}.json")[key])
    if world and (f := world / f"{name}.json").exists():
        out |= read_json(f).get(key, {})
    return out


def formats(world: Path | None = None) -> dict[str, Any]:
    return merged(world, "formats", "formats")


def hooks(world: Path | None = None) -> dict[str, Any]:
    return merged(world, "hooks", "hooks")


def templates(world: Path | None = None) -> dict[str, Any]:
    return merged(world, "structures", "templates")


def walk_open(obj: Any, path: str = "") -> Iterator[str]:
    """Paths of every OPEN value (the string, or an empty required field is checked by the schema)."""
    if obj == OPEN:
        yield path or "."
    elif isinstance(obj, dict):
        for k, v in obj.items():
            yield from walk_open(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk_open(v, f"{path}[{i}]")


def need(d: dict[str, Any], key: str, kind: type | tuple[type, ...], where: str, out: list[Finding], *, allow_open: bool = True) -> Any:
    """d[key] when present and of `kind`; an OPEN value is reported as open, a missing or wrong one as an error."""
    if key not in d:
        out.append(("error", where, f"missing `{key}` (write OPEN if undecided)"))
        return None
    v = d[key]
    if v == OPEN and allow_open:
        out.append(("open", f"{where}.{key}" if where else key, "OPEN"))
        return None
    kinds = kind if isinstance(kind, tuple) else (kind,)
    if isinstance(v, bool) and bool not in kinds or not isinstance(v, kinds):
        out.append(("error", f"{where}.{key}", f"expected {'/'.join(k.__name__ for k in kinds)}, got {type(v).__name__}"))
        return None
    return v


def one_of(value: Any, allowed: Any, where: str, out: list[Finding], *, what: str) -> None:
    if value is not None and value not in allowed:
        out.append(("error", where, f"unknown {what} «{value}»; known: {', '.join(sorted(allowed))}"))


def report(findings: list[Finding], src: str, *, strict_open: bool = False) -> bool:
    """Print findings; True when there are no errors (and, with strict_open, no OPEN fields)."""
    for level, where, msg in findings:
        print(f"[perform] {level}: {src}: {where}: {msg}", flush=True)
    count = {lv: sum(f[0] == lv for f in findings) for lv in ("error", "warn", "open")}
    print(f"[perform] {src}: {count['error']} errors, {count['warn']} warnings, {count['open']} OPEN")
    return not count["error"] and not (strict_open and count["open"])
