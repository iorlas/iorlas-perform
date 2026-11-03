# video/rigs - frozen character rigs

Plugin assets: a rig is code plus data that ships with the plugin. Profile data (a series' characters, voices, notes) stays in the user's profile folder under the plugin data dir and never here (`profiles/` is gitignored). A profile's character refers to a rig by `id@version`.

```
video/rigs/<id>/<semver>/
  rig.json      manifest: id, version, look, parts + pivots, expressions, poses, parameters, required engine verbs, palette
  rig.lock      {id, version, algorithm, sha256, files{path: sha256}}
  art/          the draw module(s), verbatim
  variants/     optional named parameter sets (data only)
  golden/       reference PNG + the harness that produced it
  RIG.md        short factual notes
video/rigs/verify.py
```

## Rules
- A released rig version is immutable. Any change (even a palette number) is a new version directory; copy, bump, lock. Patch = numbers, minor = additive expression/pose/part, major = renamed parts, moved pivots, changed parameter meaning.
- `rig.lock` hash (`sha256-tree-v1`): sha256 over sorted lines `<path>\0<file sha256>\n` of every file in the version dir, except `rig.lock` and `golden/*.png`. Write it once with `uv run video/rigs/verify.py --lock <dir>`; the script refuses to overwrite an existing lock.
- `uv run video/rigs/verify.py` fails on hash drift and on any part/expression/pose in `rig.json` missing from the art module. Run it in CI and before every render that uses a rig.
- The scene cache key includes rig id + version + hash (the `sha256` from `rig.lock`).

## What the later integration must read
- `rig.json`: `id`, `version`, `module.file` + `module.registers`, `requires.engine_api`, `requires.engine_verbs`, `requires.engine_globals`, `requires.draw_state`, `requires.optional_engine_features`, `expressions`, `poses`, `parameters`, `palette`, `look`, `seed`.
- `rig.lock`: `sha256`; refuse to render if it differs from the recomputed hash.
- Cache key components: rig id, rig version, rig sha256, engine_api, sha256 of the scene sheet, fps and size. Any rig change invalidates only scenes referencing that id.
- A scene pins `rig: "<id>@<semver>"`; the engine refuses a major mismatch.
Not wired into scene.py or the engine yet.
