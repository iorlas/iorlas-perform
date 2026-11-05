# video: process, stop points, review

## The episode flow (stop points marked STOP; the human decides at each)

```
1 idea + hook         -> STOP  Denis picks the story
2 script (scenario)   -> table read -> STOP  Denis approves the text (readable, no tags)
3 voices (perform)    -> listen   -> STOP  Denis approves by ear (cast, levels)
4 design sheet        -> sets, shots with subjects, overlays, rig gaps -> STOP  Denis approves the sheet
5 art (video-art)     -> new sets / props / rig versions, one image at a time -> STOP per image
6 render draft 720p   -> contact sheet, QA checklist, own 5 weakest spots fixed first
7 review              -> STOP  Denis accepts, or lists defects (each becomes a lessons.md line)
8 deliver             -> mp4, cover, titles, notes (shorts skill for 9:16)
```
Everything between stops is autonomous. Stopping early beats a long run on a wrong premise.
Do not do step 4 before the audio exists (shot timing comes from the timeline), and do not draw
art before the design sheet says which places, tiers and props are needed.

## Rules of review
1. **One image at a time.** Never show a grid of unrelated variants as the primary review. Show one image or one small, comparable set (same subject, labelled 1..N), ask for a number.
2. **Contact sheet** for a render: one frame per second (at 720p), labelled with shot id and time.
3. **Self-review first:** before the user sees a draft, list the five weakest spots (with shot ids) and fix them, or say why not. Report the remaining weak spots.
4. **Evidence over opinion:** claims about an image come from measurements or a vision pass, not from memory ("hand is 1.9x the wrist: measured"). For hands, noses, feet use a zoomed crop.
5. **Judge harshly.** Denis reads "fine" as a failure to look. Every option gets a verdict and the reason it fails.
6. **Do not render everything to check one thing.** A rig problem: render the face/rig alone. A set problem: render one frame. A scene problem: that scene only (`--only` slices exist).
7. **Name the numbers Denis picked.** "Number 3, but the outline is too chaotic" is the brief for the next round; keep the previous round's sheet beside the new one.
8. **Reuse beats redraw.** Before drawing a new prop or set, check the kit and the census for it (video-art `census.md`).
9. After every accepted version: freeze (rigs), commit, record the decision in the design sheet, add defects to `lessons.md`.

## What the design sheet must answer before art starts
Per scene: place, tier, time of day, recurrence; per shot: `focus`, `subjects`, frame, side; per overlay: where, size, when; per character: rig id@semver and which poses are needed (rig-gap list); per prop: the line that points at it. Template: `design-template.md`.

## Reporting
Short: verdict + link to the mp4/contact sheet + the list of remaining weak spots by shot id + what is newly decidable. Never restate the design.
