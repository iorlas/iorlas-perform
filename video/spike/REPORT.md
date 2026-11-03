# Video engine spike: HyperFrames + frozen rigs (2026-11-03)

Scene: Михалыч (mihalych@1.0.0) at the desk, Зинаида (zinaida@1.0.0) idle -> working -> error -> love, 10 s, 1280x720, 30 fps, audio muxed. Output: `out/scene.mp4`.

## Verdict
**HyperFrames: usable as the engine, with four real problems (below). Remotion not run; stay fallback.**
The rigs render unmodified (art files copied byte-for-byte, hash-verified twice) through the `hf-seek` protocol. Rig goldens reproduce bit-exact (SSIM 1.0000) in the engine's Chrome. A warm 10 s scene costs ~12 s wall.

## What worked
| Check | Result |
|---|---|
| Render | 300 frames, h264 + aac, 10.0 s, 1.7 MB. Warm: 9.2 s engine time, 12.1 s wall (8 Chrome workers, M3 Max, Chrome GPU path). Cold first run: 27.5 s engine, ~40 s wall (browser/font setup 9 s). |
| `rig.lock` refusal | `rig_lock.mjs` recomputes sha256-tree-v1. Tampered art file, tampered `RIG.md`, wrong version: all refused with the drifted file named (`test.mjs`, 9/9 pass; `build.mjs --tamper` aborts before render). The vendored copy inside the project is verified again, since that is what Chrome loads. |
| Cache key | sha256 over engine+version, adapter version, fps, size, shots.json hash, mouth/audio hashes, and per rig {id, version, sha256, engine_api}. Changes with any of those, stable under rig order (tests). Written to `out/cache_key.json`. |
| Frame t=0 / t=last vs goldens | Two checks, neither is a golden-cell pixel diff (video framing differs from the sheets): (a) vendored `golden.html` re-rendered in the HyperFrames Chrome vs frozen `golden.png`: SSIM 1.000000 for both rigs. (b) mp4 frame 0 and 299 vs the same page drawn directly: SSIM 0.9896 / 0.9894 (h264 loss). Frame 0: idle prompt, tired_neutral. Frame 299: heart on screen, pink LED. See `out/first_last.png`. |
| Mouth, expressions | Fake envelope (`mouth_open.json`, seeded) drives `mouth` 0..0.9; expression keys lerped over 0.25 s between the numeric channels of `rig.expr`. Panic (t=5.2 s) and soft_smile (7.9 s) visible. |
| Telemetry | Off. See below. |

## What broke or is not good
1. **No coordinated desk view.** Zinaida `side` (the one aligned to `sit_side`) is edge-on: the screen is invisible, so the idle/working/error/love states cannot be seen. I used Zinaida `q` (3/4) plus an `offset [110,0]` on the actor; hands land on the keyboard but the geometry is eyeballed, and `q` was never validated against `sit_side`. Needs a rig-side fix (a Михалыч `sit_q`, or a Zinaida view that shows the screen while staying aligned) before real scenes.
2. **HyperFrames lint rejects a pure `hf-seek` composition** (`missing_timeline_registry`). I vendored GSAP 3.12.7 (`src/gsap.min.js`, licence "Standard no charge", not OSS) only to register an empty paused timeline for length. Registering a stub would probably also pass; not tried.
3. **`hyperframes check` hung** (>2 min, browser step; killed). The render command itself is fine. Not diagnosed; CI cannot rely on `check` until it is.
4. **No engine layer exists.** `requires.engine_verbs` (pose, express, gaze, turn_head, lean, move, hold) are not implemented; the adapter calls `rig.draw()` directly with hand-resolved keys. No resolver, no scene.py wiring, no timeline.json, no per-scene segments or concat; shots.json here is a spike schema (`shots/0-spike`).
5. Audio: no rendered take exists in `examples/` (text only). Used `ru-voice-clone/out.wav` (8.5 s). `*.wav` is gitignored, so `audio/out.wav` is not in the commit. The mouth envelope is fake, real lip-sync untested. Audio shorter than the slot is shortened by the engine (warning), so `data-duration` must be set from the real length.
6. `npx hyperframes@0.9.9` fetches the package on first use (~24 MB unpacked); pin the version. Chrome came from an existing cache at `~/.cache/hyperframes/chrome`; a fresh machine would download it (not tested).
7. Render determinism across machines unverified: the run used Chrome GPU (Metal) capture. HyperFrames offers `--docker` for deterministic output; not tried.

## Licence and telemetry
- **HyperFrames 0.9.9: Apache-2.0** (npm metadata; the published tarball ships no LICENSE file, only README). Telemetry: PostHog (`us.i.posthog.com`), anonymous id + render stats. Off here: `~/.hyperframes/config.json` has `telemetryEnabled: false` (commandCount 0, unchanged after my renders). Hard off per run: `HYPERFRAMES_NO_TELEMETRY=1` or `DO_NOT_TRACK=1`; `build.mjs` sets both plus `HYPERFRAMES_NO_UPDATE_CHECK=1` (the CLI also runs update/skills checks and writes `~/.hyperframes/`). The package contains code for HeyGen OAuth/billing and usage endpoints of other AI vendors; none was invoked. I did not capture network traffic, so "no outbound calls" is from the code and flags, not measured. No XProtect/Gatekeeper prompt appeared.
- **Remotion 4.0.540: source-available, not OSI.** Free for individuals, for-profit orgs up to 3 employees, non-profits, and evaluation; a paid Company License is required for larger for-profit orgs. Fine for a solo/personal project, a licence risk if this ships inside a plugin used by companies of >3 people (check whether plugin users count as "using Remotion"). A licence change is flagged for Remotion 5.0.

## Cost estimate per scene
- Warm: ~0.9 s of wall time per 1 s of video at 720p/30 fps (about 30 ms CPU-bound frame, 8 workers, ~256 MB each). A 10 s scene ~12 s; a 60 s scene ~60 s; a 20 min episode ~18-20 min of render, plus ffmpeg concat. Cold start adds ~15-30 s once per process/machine.
- Cache hit costs 0. Any rig change invalidates only scenes that name that rig.
- 1080p roughly 2.25x pixels; not measured.

## Files
- `shots.json` engine-neutral spike input; `mouth_open.json` + `make_mouth.mjs` fake envelope
- `rig_lock.mjs` verify + cache key; `test.mjs` checks; `build.mjs` verify -> vendor -> render (`--tamper`, `--no-render`)
- `src/adapter.js` browser adapter; `probe.mjs` screenshot at t; `golden_repro.mjs` golden re-render
- `out/scene.mp4`, `out/cache_key.json`, `out/first_last.png`, `out/render.log`
- Run: `node build.mjs` (needs ffmpeg, Node 24, `audio/out.wav`). `PUPPETEER_CORE`/`CHROME` only for probe/golden_repro.
