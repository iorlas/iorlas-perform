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
then `$PERFORM_VOICES` (else `./voices`), then bundled: `narrator`, `vadik`, `rajesh`, `praporshchik`, `girl`, `starik`) or a new design.
A reused voice under another character's name: copy its `.wav` and `.txt` into `./voices/<name>.*`.

New voice: `uv run $S/design_voice.py NAME "description" --line "Русская фраза в характере" --profile <name>`
(without `--profile` it lands in `./voices`, which a profile episode still finds, but the profile
is then incomplete).
The description carries personality and mannerisms, not only age and pitch; the line is 8-12 s,
in character, with no brackets.

## 3. Approve

Show the user the script as readable text (character names, no tags) and the cast table
(character, voice, new or reused). Stop and wait: render only after their yes.

## 4. Render

Run in the background, then send the wav and timeline:

```
uv run $S/scene.py <name>.md <name>.wav [--engine drama3|s2] [--speed 1.1] [--gap 0.35]
                  [--scene-pause 1.5] [--max-silence 0.6] [--no-lint]
```

- The lint runs first; errors stop the render before the model loads.
- Inside a profile, the episode gets the profile's voices and `levels.json`, and the profile's
  `episodes/00-intro.md` plays first (`--no-intro` to skip; the intro file itself renders alone).
- Progress: one `[perform]` line per turn with percent, elapsed time and ETA.

- A first-use model download logs `[perform] first use: downloading ...`; relay it with the size.
- Drama 3 renders about real time; S2 ~3x slower.
- `<name>.timeline.json`: per turn `voice`, `text`, `scene`, `ambience`, `start`, `end` in seconds
  (`phone: true` on phone turns), then per effect `sfx`, `volume`, `start`, `end`, then per bed `ambience`, `volume`, `start`, `end` (`start` is
  where its 1.5 s fade-in begins, before the scene's first turn).
- Beds come from `> ambience NAME` under a scene heading (README, Ambience). Preview one alone:
  `uv run $S/ambience.py night 10 night.wav`.
- `--clips DIR` saves each turn as its own wav, for fixing one line or A/B tests.

## Sound design

Defaults in the mix, and why (sources and gaps in `${CLAUDE_SKILL_DIR}/sound-design.md`):
- Voices: one calibrated gain per voice to -20 LUFS (step 5), so no character jumps out.
- Beds: 24 dB under speech, ducking 9 dB more while anyone talks, 1.5 s crossfade at scene
  changes. Practice puts beds 12-18 dB under; the level is open (`bd show iorlas-perform-42d`).
- Effects: 8 dB under speech, placed like a turn. Put the effect right before the line that
  answers it («звонит телефон» → `{sfx phone_ring}` → «Алло!»), never on top of a word.
- Phone voices: `voice+phone:` band-limits the line like a phone call.
- Episode: target -16 LUFS integrated, true peak -1 dBTP, the podcast norm (being added:
  `bd show iorlas-perform-xn0`).

## 5. Levels

Voices cloned from different references come out at different loudness. After the first
render of a profile (or when a voice is added or sounds too loud or quiet), render with
`--clips DIR` and run:

```
uv run $S/calibrate.py DIR --profile <name>
```

Use clips from the current scene.py: it writes `clips.json` next to them with the gain, pitch
shift and phone filter each clip got, and calibrate.py undoes them, so recalibrating with a
`levels.json` in place is safe; phone-filtered turns are skipped. Clips without `clips.json`
are taken as raw. A bundled profile in an installed plugin is read-only: `profiles.py copy`
it first.

It writes `levels.json` into the profile: one gain per voice to a -20 LUFS target, plus each
voice's median pitch, and reports voices too close in pitch to tell apart. `scene.py` applies
the gains on every later render, once per voice, so whispers stay quieter than shouts. Hand
edits that survive recalibration: `offset_db` (a narrator a little under the cast) and
`semitones` (pitch shift at render; the timbre shifts with it).

Report: audio length, render time, any turn that looks wrong (much shorter than its text
suggests). Fix a bad turn by rephrasing or re-tagging it and rendering again.
