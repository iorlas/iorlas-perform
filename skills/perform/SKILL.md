---
name: perform
description: Render a ready Markdown scenario file (cast table, ## scenes, tagged turns as list items) into a multi-voice Russian audio scene, local on Apple Silicon. Casts each character to a bundled or newly designed voice, lints, then renders with scene.py (Fish Drama 3) to a wav plus a timeline.json. Use for "/perform", "render this scenario", "voice this scene". Writing or fixing the script itself is the scenario skill; given only an idea, run scenario first. For a single voice reading a text, use the voice skill.
---

# perform

Ready scenario -> cast -> approval -> lint + render -> wav + timeline. Writing the script is the `scenario` skill.
Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below. Requirements, voices, engines
and the tag guide are in the `voice` skill (`${CLAUDE_SKILL_DIR}/../voice/SKILL.md`); read it first.

## 1. Scenario

Input is a ready scenario file in the `scenario` format. Run `uv run $S/scenario.py <file>`
first. Given an idea, a draft or pasted text instead, or on lint errors, write or fix it with
the `scenario` skill (`${CLAUDE_SKILL_DIR}/../scenario/SKILL.md`) and come back. Older `.txt` files
(plain turns, `{pause N}`, optional `@cast`/`@scene`) still render; without a cast the lint skips the intro checks.

## 2. Cast

List characters and pick a voice for each: an existing one (the scenario's profile `voices/`,
then `$PERFORM_VOICES`, `./voices`, then bundled: `narrator`, `vadik`, `rajesh`, `praporshchik`, `girl`, `starik`) or a new design.
A reused voice under another character's name: copy its `.wav` and `.txt` into `./voices/<name>.*`.

New voice: `uv run $S/design_voice.py NAME "description" --line "Русская фраза в характере"`.
The description carries personality and mannerisms, not only age and pitch; the line is 8-12 s,
in character, with no brackets.

## 3. Approve

Show the user the script as readable text (character names, no tags) and the cast table
(character, voice, new or reused). Stop and wait: render only after their yes.

## 4. Render

Run in the background, then send the wav and timeline:

```
uv run $S/scene.py <name>.txt <name>.wav [--engine drama3|s2] [--speed 1.1] [--gap 0.35]
                  [--scene-pause 1.5] [--max-silence 0.6] [--no-lint]
```

- The lint runs first; errors stop the render before the model loads.
- Progress: one `[perform]` line per turn with percent, elapsed time and ETA.

- A first-use model download logs `[perform] first use: downloading ...`; relay it with the size.
- Drama 3 renders about real time; S2 ~3x slower.
- `<name>.timeline.json`: per turn `voice`, `text`, `scene`, `ambience`, `start`, `end` in seconds.
- `--clips DIR` saves each turn as its own wav, for fixing one line or A/B tests.

Report: audio length, render time, any turn that looks wrong (much shorter than its text
suggests). Fix a bad turn by rephrasing or re-tagging it and rendering again.
