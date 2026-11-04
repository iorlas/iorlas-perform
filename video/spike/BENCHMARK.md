# Engine benchmark: HyperFrames 0.9.9 vs Remotion 4.0.540 (2026-11-04)

Same scene both sides: `shots.json`, `mihalych@1.0.0` + `zinaida@1.0.0` (hash-verified, vendored byte-for-byte), same audio, 10 s, 30 fps, h264+aac. Shared code: `src/core.js` (34 lines, shots+rig -> SVG for time t). Machine: M3 Max, 14 cores, 36 GB, macOS 26.
Same Chrome binary for both (HyperFrames' chrome-headless-shell 152; Remotion pointed at it with `--browser-executable`). Telemetry/update checks off.

## Verdict (harsh)
**Keep HyperFrames as the engine. Remotion is a real, not a token, fallback.**
- HF uses 3-4.7x less CPU per scene (25 vs 73 s CPU at 720p, 35 vs 156 s at 1080p) and is ~1.4-1.6x faster in best-case wall time. On a 60 s scene Remotion burned 414 s (720p) / 895 s (1080p) of CPU.
- HF costs: lint-mandated GSAP stub, capture is not pixel-exact (SSIM 0.9975 on lossless frames vs direct draw; Remotion 1.0000), 45 Chrome processes / ~3.5 GB RSS, no cheap partial re-render, a 0.1 s start/end granularity and whole-fps limit on `--start/--end`.
- Remotion wins when: scenes are cached/rendered rarely but must be pixel-exact; you want proportional partial re-render (frame ranges: 29 s CPU for 36 % of the frames vs 73 s full; HF range saves ~15 %); the machine is shared/contended (see noise below, Remotion's wall time degraded less); you need a programmatic Node/React API and a mature ecosystem. It loses on licence: a company with more than 3 employees needs a paid licence for each user org. Check that before shipping the plugin with Remotion.
- Neither engine has incremental per-scene caching; the cache lives in our layer (key below).

## Caveat that dominates the wall-clock numbers
The machine was loaded by other work (other Claude sessions, Sim tests, Unity, Defender; load average 100-355 on 14 cores) for most of the run. Wall times below swing 10x between runs of the same config (e.g. HF 720p 60 s: 34 s in pass 1, 312 s in pass 2). Trust: (a) CPU seconds, (b) peak RSS, (c) best-case (min) wall. Medians of wall are contaminated. Two passes are kept: `bench/results_pass1_loaded.jsonl`, `bench/results.jsonl` (has `load1`).
"Cold" = new process + engine caches removed where safe (Remotion webpack cache deleted; HyperFrames bundled-font cache moved aside). The OS file cache cannot be cleared without sudo, so true first-ever-run costs are not measured (one earlier HF first run: 27.5 s engine time vs 9.2 s warm).

## 1-2. Render time, CPU, memory (10 s scene unless marked)
Best-case across both passes (6 runs each; `bench/table_best.md`):

| scenario | best wall s | CPU s (user+sys) | peak RSS MB (summed tree) | processes |
|---|---|---|---|---|
| HF 720p cold | 9.2 | 24.6 | 3818 | 46 |
| HF 720p warm | 9.8 | 24.6 | 3817 | 45 |
| Remotion 720p cold | 17.8 | 80.0 | 2548 | 16 |
| Remotion 720p warm | 12.8 | 73.2 | 2467 | 15 |
| HF 1080p cold | 14.3 | 35.0 | 3882 | 45 |
| HF 1080p warm | 17.3 (loaded) | 34.6 | 3833 | 46 |
| Remotion 1080p cold | 26.3 | 164.4 | 3290 | 16 |
| Remotion 1080p warm | 20.0 | 156.1 | 3234 | 15 |
| HF 1080p `--workers 7` | 12.7 | 31.6 | 3638 | 40 |
| Remotion 1080p `--concurrency 8` | 19.0 | 156.0 | 3481 | 16 |
| **60 s, 720p** HF | 34.2 | 92.9 | 2189 | 20 |
| **60 s, 720p** Remotion | 46.5 | 413.7 | 2768 | 15 |
| **60 s, 1080p** HF | 50.1 | 159.1 | 2594 | 20 |
| **60 s, 1080p** Remotion | 91.7 | 894.9 | 3941 | 15 |

Concurrency used: HF auto = 8 workers on this machine (HF 1080p was no faster with 7, i.e. contention, not worker count, explains the spread); Remotion default concurrency 7, also run with 8: no change. Per-run raw numbers and the loaded medians: `bench/table_pass1.md`, `bench/table_pass2.md`.
Memory is the sum of RSS over the process tree sampled every 150 ms (`/usr/bin/time -l` alone reports only the biggest single process, ~250 MB HF / 500-1200 MB Remotion). Summed RSS double-counts shared pages, so read it as an upper bound; both fit in 4 GB.
Remotion on first use also bundles with webpack (4 s idle machine, 111 s under load) and leaves a 202 MB cache.

## 3. Determinism
| check | HF | Remotion |
|---|---|---|
| same machine, 3 renders, 720p: framemd5 of all 300 frames + audio md5 | identical | identical |
| mp4 files byte-identical (0 vs 1) | yes | yes |
| HF `--docker` (arm64 image, software GL, Playwright Chromium 149) twice | byte-identical to each other | n/a |
| HF docker vs HF host GPU (Chrome 152) | **not identical**: frame hashes differ, SSIM 0.9965, PSNR 43 dB | n/a |

Docker cost: first image build 12 min (apt + Chromium download), then 3.5 min wall for the 10 s scene under load 350 (render 2m22). HF itself warns arm64 docker output is not byte-identical to amd64; amd64 parity not tried (needs emulation). So cross-machine determinism is not available without pinning to Docker, and Docker is ~10x slower. Remotion not tried across machines.

## 4. Fidelity at 1080p vs the same page drawn directly in puppeteer
| frame | HF mp4 | Remotion mp4 | HF lossless PNG | Remotion lossless PNG |
|---|---|---|---|---|
| 0 | SSIM 0.9922 | 0.9824 | 0.9975 (PSNR 45.4) | **1.0000** (identical) |
| 150 | 0.9922 | 0.9832 | 0.9976 | **1.0000** |
| 299 | 0.9923 | 0.9831 | 0.9974 | **1.0000** |

mp4 numbers are confounded by encoder settings (HF `--quality delivery`, Remotion `--crf 16`), so the engine difference is the PNG column: Remotion captures pixel-exact, HyperFrames' capture path alters pixels slightly (cause not investigated; likely its screenshot/colour pipeline). For flat cut-paper art at 0.9975 this is invisible, but it means HF frames are not byte-reproducible against a direct draw.
Frames also match the rig goldens: vendored `golden.html` re-rendered in the engine's Chrome, SSIM 1.0000 (earlier report).

## 5. Per-scene cache: only the mouth envelope changes
- Cache key (our `rig_lock.mjs`): changes (`61d3faa3...` vs `6eac5556...`) because mouth hash is an input. Rig sha256 stays the same. Whole-scene invalidation.
- Re-render cost with a new envelope, 720p, 3 runs: HF full 27 s CPU / 18.6 s best wall; Remotion full 72 s CPU / 10.8 s best wall. Same as a normal render: **no engine reuses unchanged frames.**
- Partial render of only the changed span (5.8-9.4 s, 108 of 300 frames), then you stitch with ffmpeg: Remotion `--frames=174-281`: 29 s CPU (40 % of full), best wall 6.5 s. HF `--start 5.8 --end 9.4`: 22 s CPU (about 85 % of full, with 9 processes), best wall 18.4 s: fixed per-render cost dominates, so range renders barely help on HF. (Range clips also need audio re-muxing and a seam check; not built.)

## 6. Developer ergonomics (measured)
| | HyperFrames | Remotion |
|---|---|---|
| engine-specific glue | `src/adapter.js` 14 lines + 52 in `build.mjs` (HTML template string) | `engines/remotion/src/index.jsx` 39 lines + 28 in `build_remotion.mjs` |
| shared code | `core.js` 34, `prepare.mjs` 37, `rig_lock.mjs` 52 | same |
| local install (`node_modules`) | 118 MB, 14.7 s | 242 MB, 33 s (both installed at the same time) |
| browser | reused `~/.cache/hyperframes/chrome` 193 MB | own Headless Shell: 140 MB download, 473 MB on disk, 1m45 under load; or point at any Chrome |
| first output (1 s / 1 frame, 720p, best) | 9.5 s wall, 9.3 s CPU | 12.0 s wall, 4.0 s CPU (bundle + browser start) |
| extra runtime deps | vendored GSAP 3.12.7 (72 KB, "no charge" licence) only to satisfy lint | React 18 |
| lint/check | see below | `remotion compositions` bundles + opens browser; 189 s under load (bundle alone 111 s then), no findings shown |

`hyperframes check` is not hung: it finished in 89 s (idle-ish machine, exit 0, "Check passed"). Earlier "hang" was my 100 s kill landing before it ended. It reports 0 errors and 299 warnings: `line_unread` treats every SVG `<text>` in the rigs (screen text, sticker) as a closing caption on screen < 2 s. So `check` is useless as a gate for rig art unless those rules can be disabled (not looked for), and a first lint run failed until the timeline was registered inline (a StaticGuard reads the HTML, not external scripts).

## 7. Licence and telemetry (read from the published packages and GitHub)
**HyperFrames 0.9.9**: npm metadata `license: Apache-2.0`; `https://raw.githubusercontent.com/heygen-com/hyperframes/main/LICENSE` is the full Apache 2.0 text ("Apache License Version 2.0, January 2004"). Redistribution in a plugin is allowed under Apache terms (keep notice). The npm tarball itself ships no LICENSE file, only README.
Telemetry: PostHog (`us.i.posthog.com`), anonymous id + system info + render stats, controlled by `telemetryEnabled` in `~/.hyperframes/config.json`; overridden off by `HYPERFRAMES_NO_TELEMETRY=1` or `DO_NOT_TRACK=1` (code: `telemetryRuntimeOverride`). Update check/auto-install off via `HYPERFRAMES_NO_UPDATE_CHECK=1`. The CLI also contains HeyGen OAuth/billing/credits code (not invoked). No packet capture; facts are from code.
**Remotion 4.0.540**: `LICENSE.md` (not OSI). Quoted:
- "Individuals and small companies are allowed to use Remotion to create videos for free (even commercial), while a company license is required for for-profit organizations of a certain size."
- Free if you are "an individual", "a for-profit organization with up to 3 employees", "a non-profit or not-for-profit organization", or "evaluating whether Remotion is a good fit, and are not yet using it in a commercial way".
- "You are required to obtain a Company License to use Remotion if you are not within the group of entities eligible for a Free License."
- "It is not allowed to copy or modify Remotion code for the purpose of selling, renting, licensing, relicensing, or sublicensing your own derivate of Remotion."
- "In Remotion 5.0, the license will slightly change."
For a plugin others install: the plugin would not bundle Remotion (it is `npm install`ed by the user), so each user's own eligibility decides; a company with more than 3 people using the plugin would need a Company License. That reading is mine, not legal advice, and Remotion's FAQ was not fetched.
Telemetry: no usage ping in the local `remotion render` path. The only network call in the renderer is `registerUsageEvent` to `https://www.remotion.pro/api/track/register-usage-point` (event `cloud-render`), sent only when a `licenseKey` is supplied; with none (free use) nothing is sent. There is no documented `REMOTION_DISABLE_TELEMETRY` (my bench sets it; it has no effect in this version). A browser is downloaded from Google's CDN on first use unless `--browser-executable` is given. No packet capture.

## What I could not measure
- True cold (cleared OS file cache) and first-ever install on a clean machine, including HF's Chrome download.
- Clean-machine wall times: the host was at load 100-350 almost throughout; best-case numbers are an optimistic bound, CPU seconds are the reliable figures.
- Remotion with its own Chrome; HF `--no-browser-gpu` (software) vs GPU; HF/Remotion on Linux CI; amd64 Docker parity; Remotion across machines.
- Cause of HF's 0.9975 capture difference; whether HF `check` rules can be silenced.
- 60 s scene = same 10 s looped (audio only covers the first 8.5 s), one run per config per pass.
- Network traffic (no capture; telemetry facts are from code).

## Reproduce
`node build.mjs [--size 1920x1080] [--duration 60]` (HF), `node build_remotion.mjs --chrome <chrome-headless-shell>` (Remotion), `node bench.mjs <scenario,...>` (needs `CHROME`, `engines/hf` and `engines/remotion` `npm install`), `node bench/summarize.mjs`, `node test.mjs`.
