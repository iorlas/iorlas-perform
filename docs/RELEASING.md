# Releasing

The plugin version lives in `.claude-plugin/plugin.json` only. Never edit it by hand: `dev/release.py` bumps it.
Why it matters: Claude loads skills from the plugin **cache**, not from this checkout. Merged-but-unreleased work is
invisible to every new session (found 2026-11-05: plugin.json said 0.5.0, installed was 0.4.0, no `scenario` skill).

## Steps

1. Work on a branch or worktree, never on main directly. Commit small.
2. Merge to main (fast-forward or merge commit). Main must be clean.
3. Dry run: `uv run dev/release.py "what changed"` (`--minor` for new skill / rig / engine feature, `--major` for a breaking format change).
   Gates: clean tree, on main, `video/rigs/verify.py`, `pytest tests`; `--strict` adds `ruff check scripts dev` (off by default: the video scripts landed with about 100 open findings).
4. `uv run dev/release.py "what changed" --execute`: bumps plugin.json, commits `<version>: <message>`, tags `v<version>`. It never pushes.
5. Push when Denis says so: `git push origin main v<version>`.
6. Refresh the cache: `claude plugin marketplace update` then `claude plugin update iorlas-perform`.
   Check: `ls ~/.claude/plugins/cache/*/iorlas-perform/` shows the new version, and a new session lists the skills.

## Version rules

| Change | Bump |
|---|---|
| fix in scripts, docs, skill wording | patch |
| new skill, new script flag, new rig, engine feature | minor |
| scenario / timeline / shots.json format break | major (and a migration note in the skill) |

## Rigs

A released rig version is immutable (`video/rigs/README.md`). A new pose, part or palette number is a **new version directory**:
copy `video/rigs/<id>/<old>/` to `<new>/`, change, `uv run video/rigs/verify.py --lock video/rigs/<id>/<new>`, render the golden PNG,
run `uv run video/rigs/verify.py`. Scenarios pin `id@version`; old episodes keep rendering on the old version. Rig changes ride the next plugin release.

## After a release

- Delete merged worktrees and branches (`git worktree remove`, never `--force`).
- Re-render nothing by hand: the scene cache key includes rig hash, engine API and sheet hash, so only touched scenes re-render.
