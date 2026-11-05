# video: pipeline

## Stages

| # | stage | owner | in -> out | gate |
|---|---|---|---|---|
| 1 | scenario | scenario skill | `.md` -> lint-clean `.md` | lint, table read |
| 2 | audio | perform | `.md` -> `x.wav` + `x.timeline.json` | lint; loudness (see perform) |
| 3 | timeline v2 | `videoplan.py` | timeline -> scenes (split at `##` headings and `{pause}`), beats (a turn or sfx, counted from 1), per-turn word times | scene count matches headings |
| 4 | design sheet | author (`<name>.design.json`, schema `scene-design/2`) | sets, shots per beat, `subjects`, cues, transitions, screens | design gates (below) |
| 5 | sheet | `videodesign.py` | design + timeline -> `scene-sheet/2` (derived every run: edit the design, never the sheet) | `subjects` fully in camera |
| 6 | resolver + mouth | `videoplan.py` | sheet -> `shots.json` (`shots/2`) + `mouth_<actor>.json` per turn | every speaking actor in frame has a non-empty mouth track |
| 7 | render | `video/engine/render.mjs` per scene | `shots.json` -> `scene.mp4` (video only) | rig.lock verified, cache key |
| 8 | join | `video.py` | scene videos -> concat (copy, only if engine, adapter, codec and stream params are equal) -> mux the mastered wav once | param check |
| 9 | review | process.md | contact sheet, QA checklist | qa.md |

Audio-only path is untouched: `--video` runs after the wav and timeline exist.

Commands:
```
uv run scripts/scene.py <file>.md out/x.wav --video      # speech + video
uv run scripts/video.py out/x.wav out/x.timeline.json    # video from a finished scene
node video/engine/render.mjs --scene DIR --cache DIR     # one scene (DIR: shots.json + mouth_*.json); prints one JSON line
uv run video/rigs/verify.py                              # every rig hash; run in CI and before any render
```
Needs Node >= 20 and Chrome (`PERFORM_CHROME` or Remotion's own first-use download). Voices: `PERFORM_VOICES` must point at the profile's voices when rendering outside the profile folder.

## Why two languages
- **Python owns everything upstream of `shots.json`** (timeline, design, resolver, mouth, concat, mux): it already owns the audio, the scenario and the profile, and its output is plain data that can be tested without Chrome.
- **Node owns only what needs the rigs' JS or the engine**: rigs are plain JS draw modules and stay frozen; the renderer needs a browser.
- **The seam is one JSON file**, so each side has tests that need nothing from the other, and the engine can be replaced (Remotion -> plain Chrome + ffmpeg) by re-implementing `render()`, `ENGINE`, `ADAPTER_VERSION`, `CODEC`, `COMPOSITION`. `src/adapter.mjs` + `remotion/` are the only files that know Remotion.
- Engine choice (2026-11-04): Remotion, weighted 4.55 vs HyperFrames 3.70 vs plain 4.20 on determinism 25 %, per-scene regeneration 25 %, capability 20 %. HyperFrames lost on non-pixel-exact capture and range renders that barely save time. Remotion is source-available: free for individuals and companies up to 3 people; a paid licence above that, so **check the licence before shipping to others**. Plain Chrome + ffmpeg is the escape hatch. Evidence: `video/spike/BENCHMARK.md` on the engine branch.
- Cost: about 0.9 s of wall time per 1 s of 720p/30 fps video warm; a cache hit starts no Chrome and costs 0. Cold start adds 15-30 s once.

## Cache key
`<out>/cache/<key>.mp4`. The key hashes: rig id + version + `sha256` from `rig.lock` + `engine_api`, the shots hash, per-actor mouth hashes, `core.js` and composition hashes, fps, size, codec, engine, adapter version. Consequences:
- a rig change invalidates only the scenes that name that rig;
- a changed mouth envelope (a new take) re-renders only that scene;
- an unchanged scene is a hit even after a machine restart.
Audio side: take cache key includes the text, voice, settings and `TAKES_VERSION`; whisper/hush leveling is applied **after** the cache read so changing a level never needs a re-render (see perform).

## Design gates (fail loudly)
- hand target out of the arm's reach; a seated pose requested for a rig that has none and nothing in front hides its legs; object dependency loops; a beat missing from the design;
- every shot declares `subjects`; a subject outside the camera is an error; `close` with two or more subjects is an error;
- objects in a set cite the script (a prop with no line pointing at it is decoration: cut it); things outside are seen through a window; a beat that names an object must show it.

## Format and world
Today `layout.json` is global (cast map, cameras, looks, 1280x720, 30 fps). Spec (audit item 7, not coded): a per-world `layout.json` in the profile, `--world`, a **format profile** (`landscape-720`, `shorts-1080x1920`), rig capabilities (`seated`, `legless`) as rig metadata instead of name checks. No character, rig, set or voice name may appear in `scripts/`, `video/engine/` or `skills/`. Test: delete the profile, everything still runs with another world.

## Audio facts the video depends on
- Mouth envelope comes from the **per-turn** audio RMS, normalised per turn. Per-scene normalisation: after a shout the whisper fell below the mouth-open threshold and the jaw never moved (lessons, 2026-11-05).
- Word-level times (spec, timeline v3: forced alignment on the clean TTS audio; MFA Russian or faster-whisper as fallback, accept <= 60 ms median error on a hand-marked test) will drive the "spoken noun on screen within +-0.3 s" check and karaoke subtitles.
