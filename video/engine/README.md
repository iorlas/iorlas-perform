# video/engine: the Node half of the video path (Remotion)

Two languages, split at `shots.json`.

```
scene.py (--video)                 scripts/videoplan.py + scripts/video.py (Python, uv)          video/engine/ (Node)
wav + timeline.json  ------>  timeline v2 -> scene sheet -> resolver + mouth -> shots.json  --->  render.mjs per scene
                                                                                                   rig.lock verify, cache key,
                                                                                                   adapter -> Remotion -> scene.mp4
                                  <---- ffmpeg: concat (same engine + params only) + mux the mastered wav ----
```

- **Python** owns everything upstream of `shots.json`: timeline v2, the sheet emitter (`video/layout.json`), segmenting into scenes, cue resolution, the mouth envelope from audio RMS, joining and muxing. Tests: `tests/`.
- **Node** owns only what needs the rigs' JS or the engine: `render.mjs` verifies every rig against `rig.lock` (a tampered rig aborts before staging), copies the rigs byte-for-byte, computes the cache key, renders on a miss. Rigs stay plain JS and frozen (`../rigs/`).
- **Adapter isolation:** `src/adapter.mjs` + `remotion/` are the only code that knows Remotion. `src/stage.mjs`, `src/core.js`, `src/rig_lock.mjs`, `render.mjs` are engine-neutral. A plain Chrome + ffmpeg engine means replacing those two with the same `render()`, `ENGINE`, `ADAPTER_VERSION`, `CODEC`, `COMPOSITION` exports. Engine choice and evidence: `../spike/BENCHMARK.md`.
- **Cache key** (`<out>/cache/<key>.mp4`): rig id + version + sha256 + engine_api, shots hash, per-actor mouth hashes, core.js and composition hashes, fps, size, codec, engine, adapter version. A hit starts no Chrome. Scene videos are video-only; the mastered wav is muxed once at the end.
- **Join** refuses scene videos whose engine, adapter, codec or stream parameters differ.

```
node render.mjs --scene DIR --cache DIR [--work DIR] [--chrome PATH] [--concurrency N]   # DIR: shots.json + mouth_*.json; prints one JSON line
npm ci && npm test                                                                         # 3 rig/cache-key tests
uv run ../../scripts/video.py out/x.wav out/x.timeline.json                                # a finished scene -> out/x.video/x.mp4
uv run ../../scripts/scene.py examples/night_shift.md out/ns.wav --video                   # speech + video in one go
```
Needs Node >= 20 and a Chrome (`PERFORM_CHROME`, or Remotion downloads its own on first use).

## Scene sheet (`scene-sheet/1`)
`{fps, size, camera:{viewBox}, background, lead, cast:{<voice>:{actor}}, scenes:{<scene title>|"*": {actors:[{id, rig:"id@semver", kind?, layer, pose, offset, pose_override}], cues:[{at|turn, offset?, actor, channel:"state"|"expr"|"pose", value, blend?, screen_text?, led?, shake?}], camera?, captions?}}}`.
`scene.py --video` writes `<out>.sheet.json` from `../layout.json` when it is missing (the cast on stage per scene, default expression/state) and never overwrites it: the cues are the author's acting layer, edit them and re-run; only scenes whose frames change re-render.

## Open items
- **Rig-side blocker, pairing:** Mihalych `sit_side` is edge-on to Zinaida's `side`, so her screen is invisible; the pair is Zinaida `q` + a fixed offset from `layout.json` (same in every scene, no per-scene edit). A true pair needs a new Mihalych version with a `sit_q` pose (frozen versions are not edited).
- `core.js` runs rigs that register expressions/poses on the rig or in `HF.EXPR`/`HF.POSES` (Mihalych, Zinaida, Vadik, Palych). Not yet tried: Friend, Kristina, Stas, Neyroset (add a `layout.json` cast entry per voice; a voice with no entry is an error, never a stand-in).
- Scenes come from scenario headings and `{pause}`; the default sheet acts from `[tags]` (expressions per rig, `layout.json` `expr_map`), keywords, sfx and `<!-- screen: STATE "text" -->` directives. Gaze, body poses and camera moves stay static unless hand-edited.
- Untested: camera moves, ducking, 9:16, Remotion's own Chrome on a clean machine, scenes much longer than a minute.
