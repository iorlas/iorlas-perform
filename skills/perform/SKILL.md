---
name: perform
description: Turn a scenario, story idea or plain dialogue into a finished multi-voice Russian audio scene, one command, local on Apple Silicon. Claude writes or annotates the script (speakers, emotions, pauses, emphasis, laughs), casts each character to a bundled or newly designed voice, shows the text for approval, then renders it with scene.py (Fish Drama 3) to a wav plus a timeline.json for screen changes. Use for "/perform", "voice this scene", "make an audio story", "radio play", "audio drama". For a single voice reading a text, use the voice skill instead.
---

# perform

Scenario (scenario skill) -> cast -> approval -> lint + render -> wav + timeline.
Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below. Requirements, voices, engines
and the tag guide are in the `voice` skill (`${CLAUDE_SKILL_DIR}/../voice/SKILL.md`); read it first.

## 1. Script

Input is a file, pasted text, or only an idea. Write or fix the script with the `scenario`
skill (`${CLAUDE_SKILL_DIR}/../scenario/SKILL.md`): it covers the format (`@cast`, `@scene`,
tagged turns), the radio-drama rules, the lint and the self-check. Old flat files (turns and
`{pause N}` only) still render; the lint then skips the intro checks.

## 2. Cast

List characters and pick a voice for each: an existing one (`$PERFORM_VOICES`, `./voices`,
bundled: `narrator`, `vadik`, `rajesh`, `praporshchik`, `girl`, `starik`) or a new design.
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
