---
name: perform
description: Turn a scenario, story idea or plain dialogue into a finished multi-voice Russian audio scene, one command, local on Apple Silicon. Claude writes or annotates the script (speakers, emotions, pauses, emphasis, laughs), casts each character to a bundled or newly designed voice, shows the text for approval, then renders it with scene.py (Fish Drama 3) to a wav plus a timeline.json for screen changes. Use for "/perform", "voice this scene", "make an audio story", "radio play", "audio drama". For a single voice reading a text, use the voice skill instead.
---

# perform

Scenario -> tagged scene -> cast -> approval -> render -> wav + timeline.
Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below. Requirements, voices, engines
and the tag guide are in the `voice` skill (`${CLAUDE_SKILL_DIR}/../voice/SKILL.md`); read it first.

## 1. Script

Input is a file, pasted text, or only an idea. Write `<name>.txt` in the user's working directory
in scene format, one turn per line:

```
# Title
narrator: [dry, deadpan] В понедельник Вадика повысили.
vadik: [panicking] Это плановая миграция!
{pause 1}
```

- `voice: text`; the voice name is the character's voice file name. `{pause N}` = N seconds of
  silence, use it for scene changes. `#` lines are comments.
- Every turn starts with a delivery tag, free-form English: `[nervous, too fast]`,
  `[suspicious, sarcastic question]`. One idea per turn; split long monologues into turns
  of 1-3 sentences (each turn is one render, ~47 s cap).
- Questions: tag the intonation (`[provocative, rising intonation]`), or they come out flat.
- Laughs: `[bursts out laughing] Текст! [laughs uncontrollably]`. Never spell "ха-ха".
- Russian text only inside turns; no bracketed Russian, it is read aloud.
- Narrate like a book. The narrator speaks on every scene change (where, what is around,
  one concrete detail ending on a punchline), every time jump ("Утро.", "В пятницу, в шесть
  вечера"), and when a new voice enters (who they are, how they appear). Once two speakers
  are introduced and trading lines, drop attributions; add «— сказал Вадик» only where it
  adds a beat. Attribution turns get a short gap: `narrator@0.12:`.
- Ambience: on every scene change, put `{ambience NAME}` on the line before the narrator's
  announcement ("Ночь. Офис."). The bed crossfades in over 1.5 s and is up as the line
  starts. Pick by place and time:

  | scene | bed |
  |---|---|
  | office, open space, day | `office` (chatter, keyboards, air conditioner) |
  | kitchen, flat, home | `kitchen` (fridge hum, TV through the wall) |
  | evening, outside, city | `evening` (traffic, a few crickets) |
  | night, outside or by a window | `night` (crickets, distant cars, wind) |
  | rain, street, courtyard | `rain` (rain in a Saint Petersburg courtyard) |
  | outdoors, storm, roof | `wind` |

  `{ambience night 0.5}` = half volume (1 = default, already low and ducked under speech);
  `{ambience off}` fades to silence before the next turn; at the very end it is not needed
  (the last bed rings 1 s past the last word, then fades). A scene opening on `{ambience}`
  starts its first word at 1.5 s so the bed is heard first. A scene with no `{ambience}`
  line renders as before.
- Phone calls: `palych+phone: Алло?` renders that turn through a telephone band.
- Spacing: `voice@N:` sets the gap before a turn (default `--gap`); negative overlaps the
  previous turn, for interruptions. `{pause 1-2}` between scenes.
- Writing a story from an idea: keep it short first (15-25 turns, ~2 min), adult humour when
  asked for humour: irony, deadpan narrator, specific absurd details, a punchline at the end.

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
```

- A first-use model download logs `[perform] first use: downloading ...`; relay it with the size.
- Drama 3 renders about real time; S2 ~3x slower.
- `<name>.timeline.json`: per turn `voice`, `text`, `start`, `end` in seconds (`phone: true`
  on phone turns), then per bed `ambience`, `volume`, `start`, `end` (`start` is where its 1.5 s fade-in
  begins, before the turn).
- Preview a bed alone: `uv run $S/ambience.py night 10 night.wav`.
- `--clips DIR` saves each turn as its own wav, for fixing one line or A/B tests.

Report: audio length, render time, any turn that looks wrong (much shorter than its text
suggests). Fix a bad turn by rephrasing or re-tagging it and rendering again.
