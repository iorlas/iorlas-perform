#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Verify every frozen rig under video/rigs/<id>/<semver>/.

Checks per rig dir:
  1. rig.lock matches the recomputed content hash (and id/version match the directory names).
  2. rig.json names (parts, expressions, poses) exist in the art module (static regex check).

  uv run video/rigs/verify.py              # verify all rigs under this folder
  uv run video/rigs/verify.py --root DIR   # verify rigs under another root (tests)
  uv run video/rigs/verify.py --lock DIR   # write rig.lock for a NEW rig dir (refuses if one exists)

Hash (sha256-tree-v1): sha256 over lines "<posix path>\\0<sha256 of file>\\n", sorted by path, for every file
under the rig dir except rig.lock, golden/*.png and OS/Python junk.
"""

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ALGORITHM = "sha256-tree-v1"
JUNK = {".DS_Store"}


def _excluded(rel: Path) -> bool:
    if rel.name in JUNK or "__pycache__" in rel.parts:
        return True
    if rel.as_posix() == "rig.lock":
        return True
    return rel.parts[0] == "golden" and rel.suffix.lower() == ".png"


def file_hashes(rig_dir: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for path in sorted(rig_dir.rglob("*")):
        rel = path.relative_to(rig_dir)
        if path.is_file() and not _excluded(rel):
            out[rel.as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return out


def tree_hash(files: dict[str, str]) -> str:
    listing = "".join(f"{p}\0{h}\n" for p, h in sorted(files.items()))
    return hashlib.sha256(listing.encode()).hexdigest()


def static_check(rig_dir: Path, manifest: dict) -> list[str]:
    errors: list[str] = []
    module = rig_dir / manifest["module"]["file"]
    if not module.is_file():
        return [f"module missing: {module.name}"]
    src = module.read_text(encoding="utf-8")
    errors += [
        f"part {p['name']!r}: {p['draw']} not defined in module"
        for p in manifest["parts"]
        if not re.search(rf"\b{re.escape(p['draw'])}\s*=\s*function", src)
    ]
    errors += [
        f"expression {n!r} not defined in module"
        for n in manifest["expressions"]
        if not re.search(rf"\b{re.escape(n)}\s*:\s*ex\(|\bX\.{re.escape(n)}\s*=", src)
    ]
    errors += [f"pose {n!r} not defined in module" for n in manifest["poses"] if not re.search(rf"\b{re.escape(n)}\s*:\s*\{{", src)]
    return errors


def verify_rig(rig_dir: Path) -> list[str]:
    lock_path, manifest_path = rig_dir / "rig.lock", rig_dir / "rig.json"
    if not manifest_path.is_file() or not lock_path.is_file():
        return ["rig.json or rig.lock missing"]
    manifest, lock = json.loads(manifest_path.read_text("utf-8")), json.loads(lock_path.read_text("utf-8"))
    errors: list[str] = []
    if (manifest["id"], manifest["version"]) != (rig_dir.parent.name, rig_dir.name):
        errors.append(f"rig.json id/version {manifest['id']}@{manifest['version']} does not match dir {rig_dir.parent.name}/{rig_dir.name}")
    if lock.get("algorithm") != ALGORITHM:
        errors.append(f"unknown hash algorithm {lock.get('algorithm')!r}")
    files = file_hashes(rig_dir)
    got = tree_hash(files)
    if got != lock.get("sha256"):
        locked = lock.get("files", {})
        changed = sorted(p for p in files.keys() | locked.keys() if files.get(p) != locked.get(p))
        errors.append(f"hash drift: lock {lock.get('sha256')} != actual {got}; changed: {', '.join(changed) or '?'}")
    return errors + static_check(rig_dir, manifest)


def write_lock(rig_dir: Path) -> int:
    if (rig_dir / "rig.lock").exists():
        print(f"refusing: {rig_dir}/rig.lock exists; a released rig version is immutable, make a new version dir")
        return 1
    manifest = json.loads((rig_dir / "rig.json").read_text("utf-8"))
    files = file_hashes(rig_dir)
    lock = {"id": manifest["id"], "version": manifest["version"], "algorithm": ALGORITHM, "sha256": tree_hash(files), "files": files}
    (rig_dir / "rig.lock").write_text(json.dumps(lock, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {rig_dir}/rig.lock sha256={lock['sha256']}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parent)
    ap.add_argument("--lock", type=Path, help="write rig.lock for this new rig dir")
    args = ap.parse_args()
    if args.lock:
        return write_lock(args.lock)
    rig_dirs = sorted(p.parent for p in args.root.glob("*/*/rig.json"))
    if not rig_dirs:
        print(f"no rigs under {args.root}")
        return 1
    failed = False
    for rig_dir in rig_dirs:
        errors = verify_rig(rig_dir)
        name = f"{rig_dir.parent.name}@{rig_dir.name}"
        if errors:
            failed = True
            print(f"FAIL {name}")
            for e in errors:
                print(f"  - {e}")
        else:
            print(f"ok   {name}  sha256={json.loads((rig_dir / 'rig.lock').read_text('utf-8'))['sha256']}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
