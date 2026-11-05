# world-bootstrap: stages

Each stage: **in**, **make**, **out (file)**, **stop (what Denis approves)**, **owner**, **done-test**.

## 0 World brief
- In: Denis's intent; platform-research hypotheses (refresh first).
- Make: fill `brief-template.md` with Denis, one question at a time; research each platform/policy claim and tag evidence.
- Out: `brief.md`. Stop A: the answers, and the OPEN rows he must decide.
- Owner: this skill + `platform-research`. Done: no empty field; every OPEN has an owner and a date.

## 1 Style bible (once per world)
- In: brief (platform, audience, genre). Make: look study (12 looks, pick by number, calm the lines), palettes day/night, hero rig rules (proportions, hands, expressions, no default prop), set tiers and kit starting list, **subtitle style and cover style for the platform**, corner mark and sting spec, anti-list for this world.
- Out: `video/style.md`, `video/brand/`. Stop B: one image at a time (look, then the first anchor set).
- Owner: video-art (+ shorts `packaging.md`). Done: the first set passes the video-art short list; golden of one hero frozen.

## 2 Series bible
- In: brief, style. Make: world docs (setting, rules, recurring entities), cast with a role and a job per character, **voices cast and lint-clean**, relationships and who owns which kind of situation, running gags and callbacks, open guns, the failure ledger, one rig per cast member planned (rig-gap list).
- Out: `world.md characters.md relationships.md arcs.md voices/ levels.json`. Stop C: voices by ear; the cast table.
- Owner: scenario (0, profiles), voice/perform, video-art `rigs.md`. Done: `profiles.py` shows no template hints; casting lint clean.

## 3 Idea matrix and scorer
- In: series bible, axis lists, `distinctness.md` log. Make: 10 situation x place pairs scored 0-2 for one-second clarity, twist, showability; top 3 with a 2-line premise, 5 hook lines (<= 12 words) each, and the **new-art cost**; run the **distinctness check** against the last N episodes.
- Out: `ideas/<slug>.md`. Stop D: Denis picks one.
- Owner: this skill (`idea-matrix.md`, `distinctness.md`). Done: top 3 with scores; the check recorded as pass/fail for each.

## 4 Script for the medium
- In: picked idea, brief (format, length, audience), mode. Make: the beat sheet **for the format**, then the scenario steps; table read; listener and line checks; distinctness re-check against the final text.
  | format | beat sheet |
  |---|---|
  | Shorts 40-60 s | hook 0-1.5, setup 1.5-6, escalate 6-15 with a re-hook at 8-15, turn 15-35, twist 35-45, tag 45-50 (shorts `hooks.md`) |
  | 16:9 about 3 min | cold open (best 10-20 s), 2 s title card, sketch in the mode's beat sheet (scenario `design.md` step 3), tag |
  | audio episode 3-6 min | the mode's episode structure |
  The Short and the long version are different scripts; do not trim a wav (shorts `cut-down.md`).
- Out: `episodes/NN-slug.md` (lint-clean). Stop E: the script as readable text.
- Owner: scenario. Done: lint clean; table read run (3+ characters); hook checklist (shorts) passes for a Short; distinctness gate passes.

## 5 Voice
- Make: cast check, render, listen, loudness per format. Out: `renders/NN.wav` + timeline. Stop F: by ear. Owner: perform/voice.

## 6 Design sheet and assets
- Make: the design sheet (video `design-template.md`) with `subjects` per shot, census, rig-gap list; then missing sets, props and rig versions one image at a time. Out: `NN.design.md/.json`, census, art. Stop G: the sheet first, then each image.
- Owner: video, video-art. Done: every place has a tier and status; no rig gap without a workaround.

## 7 Assembly and QA
- Make: render per scene, 720p draft, contact sheet, QA checklist (video `qa.md`), the model's five weakest spots fixed first; for Shorts the hook gate and length gate (shorts `spec.md`). Out: draft mp4 + contact sheet. Stop H: accept or list defects; each defect becomes a ledger line.
- Owner: video, shorts.

## 8 Delivery
- Make: cover, 3 titles <= 60 chars (honest, numbered), description, music/SFX licence manifest, `notes.md` of failures, **distinctness log entry**, canon update (scenario 11). Out: the files and the log. No stop: Denis uploads.
- After 48-72 h (Shorts): read viewed-vs-swiped and the retention curve; record the numbers beside the episode; apply the brief's success and kill rules.
