# video/engine: per-scene video render (Remotion)

timeline.json + scene sheet + mixed wav -> `shots.json` per scene -> Remotion -> cached per-scene mp4 -> concat -> `final.mp4`.
Engine choice and evidence: `../spike/BENCHMARK.md` (Remotion 4.0.540; plain Chrome + ffmpeg is the fallback). Audio-only mode (`scripts/scene.py`) is untouched.

```
node cli.mjs --timeline demo/demo.turns.json --sheet demo/demo.sheet.json --audio demo/demo.wav --out out/demo [--only s01] [--chrome PATH] [--concurrency N] [--xfade 0.5]
./demo/make_audio.sh   # builds demo/demo.wav (gitignored) from two existing takes
npm test               # unit tests + slow end-to-end render tests (need a Chrome: PERFORM_CHROME or Remotion's own)
```

## Flow
1. `src/resolve.mjs` `segment()`: consecutive turns with the same `scene` title become one scene (`s01`, `s02`, ...), padded by `lead`/`tail`, whole frames, no overlap.
2. `resolveScene()`: the scene sheet's `cues` (`at` seconds, or `turn` number + `offset`, both scene-relative after resolving) become `tracks` of keys. Mouth: `src/mouth.mjs` computes `mouth_open` per video frame from the scene's audio RMS, gated to the speaking actor's own turns (`cast` maps a timeline `voice` to an actor id).
3. `src/stage.mjs`: every referenced rig is checked against `rig.lock` (tampered = abort before anything renders), copied byte-for-byte into `public/rigs/`, checked again, then the scene files are written and the cache key computed: rig id + version + sha256 + engine_api, shots hash, per-actor mouth hash, audio hash, core.js hash, composition hash, fps, size, engine version.
4. `src/render.mjs`: bundle once (only if some scene misses), then `cache/<key>.mp4`; a hit starts no Chrome.
5. `src/concat.mjs`: copy-concat after checking identical codec params (files from different engines or settings are refused); `--xfade s` re-encodes with crossfades.

## Scene sheet (`scene-sheet/1`)
`{fps, size, camera:{viewBox}, background, lead, tail, cast:{<voice>:{actor}}, scenes:{<scene title>|"*": {actors:[{id, rig:"id@semver", kind?, layer, pose, offset, pose_override}], cues:[{at|turn, offset?, actor, channel:"state"|"expr"|"pose", value, blend?, screen_text?, led?, shake?}], camera?, captions?}}}`.
Actors of `kind: "object"` (derived from the rig's `body_type`) use the `state` channel; characters use `expr`/`pose` and get a mouth envelope.

## Open items
- Mihalych `sit_side` is edge-on to Zinaida's screen. The demo uses Zinaida `q` with a hand-tuned `offset`; a coordinated pair (a Mihalych `sit_q`, or an aligned Zinaida view) is a rig task.
- timeline.json is today's v1 (`scene.py` output: turns, sfx, ambience). Nothing emits a "v2" or a scene sheet yet; the sheet is written by hand.
- Untested: camera moves, audio ducking, per-scene audio from the real mix (the demo cuts a stand-in wav), vertical 9:16 variants through this path, Remotion with its own downloaded Chrome.
- Not wired into `scripts/scene.py` or the `perform` skill.
