# Pre-production: find the defects before the render

The video path used to find its problems at the end: a cropped face, a pose the rig never had, a flickering label, a 17-second static shot, all after minutes of real-time TTS and a full Remotion render. Pre-production moves every check that needs no audio and no video encoding to the front, and makes each stage cheap enough to run after every edit.

Rule: **no audio render and no full video render until the gates of stages 1-3 pass.** Everything below runs from the script and the design file alone, in seconds.

World-agnostic: this repo ships code, format profiles and engine. Characters, sets, rigs, cast maps and cards come from the design file, the world's layout file (`--layout`, default `video/layout.json`) and the rig library. Nothing here names a character.

## The ladder

| # | Stage | Command | Input | Output | Cost (Pravila v3, 3.7 min) |
|---|---|---|---|---|---|
| 0 | Script lock | `episode.spec` + scenario lint (`scenario.py`) | idea, script | locked script, estimated timeline (`video.py estimate`) | under 1 s |
| 1 | Storyboard | `video.py storyboard` | script + design | one still per shot, cards, overlay states; contact sheet; `storyboard.json` | 37 s wall (9.5 s CPU) for 40 stills at 640x360 |
| 2 | Animatic | `video.py animatic` | same | 360p draft mp4 on the estimated timeline, subtitles, cards; scratch voice where takes exist | 28 s wall (22 s CPU), 228 frames |
| 3 | Gates | `video.py capability`, `video.py gates` | same | findings, exit 1 on a blocking one | capability 0.8 s, gates 0.6 s |
| 4 | Final audio | `scene.py` (cache-aware) | locked script | wav + `timeline.json` | minutes, real-time TTS; cached takes are free |
| 5 | Retime | `video.py retime` | script + design + real `timeline.json` | what moved, which scenes re-render, gates on real timing | 1.2 s |
| 6 | Full render + QA | `video.py out.wav out.timeline.json` | wav, timeline, design | mp4; only changed scenes render | per scene; `--draft` for a 640x360 15 fps pass |

Stages 1-3 are one loop: edit design or script, re-run, read the sheet and the gate table. Stage 4 starts only after 3 is clean on the points that cost audio (script length, hook, who speaks first), and may start earlier for lines that will not change.

### Gates (stage 3)

Thresholds come from the format profile (`video/formats/*.json`, `gates`). A world can ship its own profile and pass its path to `--format`.

| Gate | Checks | Severity | Found on Pravila before any render |
|---|---|---|---|
| capability | poses, expressions, rigs, sets, slots, overlay kinds, cards, screens the design names, against `rig.json`, the art files, `core.js`, `video/art/cards`. Art files' own `rig_gaps` are listed as known workarounds. A flat placeholder set is a warning. | gap blocks; placeholder, known workaround warn | with the pre-`grip_rail` rig (vadik 1.2.1) the missing `grip_rail_phone` pose, in 0.8 s |
| framing | a declared subject cut by the camera (start or end of a push); a seated character with no hidden legs; a named object not in frame; a cast head cut by the frame edge; a shot that declares no subjects | block; the last two warn | shot 4.1, Palych's head 50% outside the left edge |
| rhythm | no stretch with no event (cut, overlay, state, pose, screen change, camera move) longer than `static_warn_s` (warn) or `static_block_s` (block); no shot under `shot_min_s` | block / warn | 17.8 s static on 1.5 and 17.4 s on 4.8; a 0.15 s shot 2.1b |
| flicker | overlay visible under 0.6 s, overlay text state held under 0.8 s, a state flipping A-B-A within a second | warn | card overlay on 5.4 shown for 0.08 s on the estimate, 0.41 s on the real timeline |
| zones | an overlay inside the subtitle band while someone speaks; overlays in platform-UI zones (Shorts); for 9:16, subjects that do not fit the crop window | block / warn | CRT rule text overlaps the subtitles on shots 2.2-2.10 and the resume table on 5.3-5.4 |
| textfit | subtitle chunk wider than the line; card text wider than the frame at the engine's size; card up too briefly to read | block / warn | |
| shorts | total over `total_max_s`; first voice later than `first_voice_by_s`; first frame with no character; a hook that is a long narrator line | block / warn | active under `shorts-1080x1920` and `landscape-3min` |
| distinct | set ids and scene titles shared with earlier episodes' design files (`--previous`) | warn | |

`video.py gates` prints a table grouped by kind, writes `gates.json` and `gates.md`, and exits 1 on any blocking finding (`--warn-only` to read without failing a CI job). Findings carry scene, shot, scene-relative and film time, message, fix.

### What runs in parallel after script lock

| Track | Needs | Blocks |
|---|---|---|
| A. Audio render (`scene.py`) | locked script | retime (5), full render (6); long: start first |
| B. Storyboard, animatic, gates (1-3) | script + design | the design edits that change shot beats; not audio |
| C. Art-gap work | `video.py capability` report (gaps, placeholders) | full render of the scenes whose sets or poses are gaps; not 1-3 (placeholders draw) |
| D. Cover, title and end cards, subtitle style | design `cards`, format profile zones | full render only; cards appear on the storyboard as they are drawn |
| E. Distinctness against earlier episodes | design files of earlier episodes | nothing: advisory |

Blocking relations: 0 blocks everything. 3 blocks 6, not 4. 4 and 5 block 6. A design edit after retime re-enters at 1 and costs only the stages 1-3 loop plus a re-render of the scenes whose `shots.json` hash changed.

## Estimated timeline

`videoestimate.py` places turns, sound effects, `{pause}`s and scene gaps as `scene.py` does (gap 0.35 s, scene pause 1.5 s, 1.5 s lead on an opening ambience). A turn lasts `spoken characters / 12.9` seconds. 12.9 characters per second was measured on the Pravila render (30 turns, summed estimate within 1% of the real turns: 207.0 s against 208.1 s for the whole film). Speed tags (whispering, slurred) did not move the pace on Pravila and are not modelled; `--pace FILE` takes `{voice: chars/s}` per world and `TAG_SPEED` is there to fill in when a world shows otherwise.

Known seconds replace estimates: a past render (`--scratch-audio RENDER` where `RENDER.wav` and `RENDER.timeline.json` exist) or a takes directory. `scene.py` now writes `takes/index.jsonl` (key, voice, text, seconds) next to the cached takes so the cache can be searched without recomputing keys; takes cached before this change have no index. Matching is by (voice, text): an edited line stays an estimate.

Retime on an edited script: `video.py retime --hybrid` uses real seconds only for lines that did not change.

## Stills and the animatic

The stills page loads the same rigs (verified against `rig.lock`, as the full render does), the same `core.js` and the same `shots.json`, and draws `SpikeCore.frame(t)` into a grid in one headless Chrome. One screenshot, cut with ffmpeg. No Remotion, no bundler, no Node. A still at time t is the video frame at t; what it does not test is video encoding and Remotion's frame scheduling.

- HUD on the storyboard: shot id, frame type, length, the heard line, subject boxes (green inside the frame, red `CROPPED`), the safe zones and the subtitle band of the format, and for Shorts the 9:16 window.
- Frames: the middle of each shot (`--frames 3` for start/middle/end); every transition card; every overlay state not visible on the shot's main still.
- Animatic frames: every event that changes the picture (cuts, overlay and screen changes, caption chunks, card fades) and 2 fps inside push-ins, held until the next; ffmpeg joins them at 15 fps, 640x360. Subtitles come from `videosubs.py` (one line, no line ends on a preposition, a chunk is held at least 0.6 s, word timing proportional to characters). Scratch voice is placed at each turn's start.
- Needs Chrome (`PERFORM_CHROME` or a standard install) and ffmpeg.

## Formats

`video/formats/landscape-720.json` (default), `landscape-3min.json` (cold open in 15 s, static limit 6/10 s, under 240 s), `shorts-1080x1920.json` (zones from `research/shorts_hooks.md`: top 12%, bottom 30%, right 15%; subtitles at 55-70% of the height; static limit 3/4.5 s; first voice by 0.5 s; under 60 s). The engine's cameras are 16:9: the Shorts profile checks and previews a 9:16 crop of the 16:9 frame, but the full render of a vertical film is not built (see What is left).

## Draft render

`video.py AUDIO TIMELINE --draft` renders the full engine at 640x360, 15 fps into `<stem>.draft.mp4`. Size and fps are part of `shots.json`, so draft scenes have their own cache entries and never reach the final join. Use it for a motion check (push-ins, transitions, mouth sync) once the audio exists.

## Files a run writes (`<scenario stem>.pre/`)

`estimate.json` (timeline v1), `scenes/<id>/shots.json`, `storyboard/*.png`, `storyboard/contact_sheet*.png`, `storyboard/storyboard.json`, `animatic/animatic.mp4`, `capability.md|json`, `gates.md|json`, `retime.md|json`.

## What is left

- Vertical (9:16) cameras and sets: the storyboard previews a crop, the gates tell you what does not fit, the engine does not draw 9:16.
- Subtitles in the final render: `videosubs.py` emits the engine's `captions` shape, but the final sheet does not carry them yet; word timing from whisper replaces the proportional estimate.
- A table read of the script by actor subagents before stage 4 is a `scenario` skill matter (not here).
- Retime shows the shots that moved; moving a design beat automatically is not done.
- Frame-accurate flicker needs the real video: the gates see overlay windows, not pixel changes.
