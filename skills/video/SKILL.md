---
name: video
description: Turn a rendered audio scene (wav + timeline.json) into a video of animated flat cut-paper puppets: frozen hash-locked rigs, per-scenario design sheet, camera from what each line is about, Remotion render per scene with a cache, concat and mux. Use for "make a video", "animate this scenario", "render the video", "design sheet", "shots.json", "scene looks wrong", "add a character to the video", or when a video render has a defect. Drawing sets, rigs and props is the video-art skill; Shorts format is the shorts skill; a new world is world-bootstrap; the audio is perform.
---

# video

Scenario `.md` -> audio (perform) -> video. Two languages meet at one file, `shots.json`.
Everything below is the **contract**; the code that implements it is in `scripts/video*.py` and `video/engine/` (on main since 0.6.0; see `docs/MAP.md`). Where a rule says "spec", it is
written here and not in code yet.

```
scenario.md --perform--> wav + timeline.json
  -> timeline v2 -> design sheet (author) -> resolver -> shots.json         Python (uv)
  -> Remotion adapter: rig.lock check, cache key, render per scene -> scene.mp4   Node
  -> ffmpeg concat (same engine/params only) + mux the mastered wav -> episode.mp4
```

| file | read it when |
|---|---|
| `pipeline.md` | running or debugging the pipeline: stages, commands, the two-language split and why, cache key |
| `contracts.md` | touching `shots.json`, the design file, the sheet, rig freeze, `subjects`, the camera |
| `process.md` | starting an episode: stop points, who approves what, the one-image-at-a-time review |
| `design-template.md` | writing the per-scenario design sheet (copy it) |
| `qa.md` | before showing any render: the checklist (Kylo 13 points + our defects) |
| `remotion-rules.md` | writing or reviewing any frame-driven component |
| `lessons.md` | **read before designing**; append one dated line for every new defect |
| `${CLAUDE_SKILL_DIR}/../video-art/SKILL.md` | any drawing: sets, rigs, props, looks, review |
| `${CLAUDE_SKILL_DIR}/../shorts/SKILL.md` | a 9:16 output under 3 minutes |

## The ten rules (each one cost a render)

1. **One rig per voice, pinned `id@semver`.** A voice with no rig entry is an error, never a stand-in. A missing, tampered or foreign rig is a hard error that names the file.
2. **Released rigs are immutable.** A change, even a palette number, is a new version directory.
3. **Every shot declares `subjects`** (what the line is about). The camera is the union box of the subjects plus margin; a subject cut by the frame is an error, not a taste.
4. **Zoom clamp:** several subjects never zoom past 1.6x; a close-up is for exactly one subject.
5. **Overlays are not sets.** Anything that is screen-in-screen, a label, a card or a phone call is an overlay module with its own position and size, constant for the whole scene.
6. **Lip-sync owns the jaw.** The mouth envelope is per turn (normalised per line, not per scene), and a test fails when a speaker is in frame with an empty mouth track.
7. **Per-scene cache.** A scene re-renders only when its key changes; never edit a scene video by hand.
8. **Motion only through frame number** (`useCurrentFrame`, `interpolate`); no CSS transition, no `setTimeout`, no `backdrop-filter` blur.
9. **Review one image at a time**, then a contact sheet; the model lists its own five weakest spots before the user sees anything.
10. **Every defect becomes a ledger line** in `lessons.md` and, where it can be counted, a test.

## Not in scope here
Intro/sting/cover/subtitles/safe zones for Shorts (shorts). Rig drawing rules, set tiers, style grammar (video-art).
