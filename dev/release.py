#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Release the plugin: gates, version bump of .claude-plugin/plugin.json, commit, tag. Never pushes.

    uv run dev/release.py "message" [--minor | --major] [--execute]

Dry run by default: prints what it would do. With --execute: runs the gates, bumps plugin.json
(patch by default), commits "<version>: <message>" and tags v<version>. Pushing, refreshing the
plugin cache and deleting branches stay manual (docs/RELEASING.md).

Gates (any red aborts): clean tree, on main, rig lock verify, tests/; --strict adds ruff.
Adapted from iorlas-task-loop's dev/release.py, without its clone, lock and marketplace machinery.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / ".claude-plugin" / "plugin.json"


def run(*cmd: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, check=check)


def bump(version: str, part: str) -> str:
    major, minor, patch = (int(x) for x in version.split("."))
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def gates(*, strict: bool) -> list[str]:
    """Names of the gates that failed."""
    failed = []
    if run("git", "status", "--porcelain").stdout.strip():
        failed.append("tree not clean")
    if run("git", "branch", "--show-current").stdout.strip() != "main":
        failed.append("not on main")
    if (ROOT / "video/rigs/verify.py").exists() and run("uv", "run", "--no-project", "video/rigs/verify.py", check=False).returncode:
        failed.append("rig verify")
    if strict and run("uvx", "ruff", "check", "scripts", "dev", check=False).returncode:
        failed.append("ruff")  # off by default: the video scripts landed with ~100 open findings (docs/MAP.md); --strict once cleaned
    if (ROOT / "tests").exists() and run(
        "uv", "run", "--no-project", "--with", "pytest", "--with", "numpy", "--with", "soundfile", "pytest", "tests", "-q", check=False
    ).returncode:
        failed.append("tests")
    return failed


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("message")
    ap.add_argument("--minor", action="store_true")
    ap.add_argument("--major", action="store_true")
    ap.add_argument("--execute", action="store_true")
    ap.add_argument("--strict", action="store_true", help="also gate on ruff")
    args = ap.parse_args()
    part = "major" if args.major else "minor" if args.minor else "patch"
    manifest = json.loads(MANIFEST.read_text())
    new = bump(manifest["version"], part)
    print(f"{manifest['version']} -> {new} ({part}): {args.message}")
    failed = gates(strict=args.strict)
    if failed:
        print("gates red:", ", ".join(failed))
        if args.execute:
            return 1
    if not args.execute:
        print("dry run: nothing changed (--execute to commit and tag)")
        return 0
    text = MANIFEST.read_text()
    MANIFEST.write_text(re.sub(r'"version":\s*"[^"]+"', f'"version": "{new}"', text, count=1))
    run("git", "add", str(MANIFEST))
    run("git", "commit", "-m", f"{new}: {args.message}")
    run("git", "tag", f"v{new}")
    print(f"committed and tagged v{new}. Next: git push origin main v{new}; refresh the plugin cache (docs/RELEASING.md)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
