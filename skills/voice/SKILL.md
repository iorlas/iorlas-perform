---
name: voice
description: Voice a Russian text or scene locally on Apple Silicon with a cloned or designed voice, ElevenLabs-style inline tags (laughs, sighs, whispers, shouting), via Fish Drama 3 or Fish S2 Pro on mlx-audio. Use when the user wants text turned into speech audio, a character voice designed from a description, their own voice recorded for cloning, or a story or monologue rendered to a wav. Skip for speech-to-text, cloud TTS, or non-Mac machines.
---

# voice

Local TTS: tagged text -> wav, voice cloned from one reference recording.
Scripts live in `${CLAUDE_SKILL_DIR}/../../scripts`; call that `$S` below.

## Requirements

Check once, stop and tell the user if any is missing:
- Apple Silicon Mac (`uname -m` = arm64), 32 GB RAM or more.
- `uv` and `ffmpeg` on PATH.
- Disk, only for engines actually used: Drama 3 19.8 GB (default), Fish S2 Pro 10 GB,
  Qwen VoiceDesign 4.5 GB. Each downloads to `~/.cache/huggingface` on its first use and
  logs `[perform] first use: downloading ...`; relay that line and say the wait is 20-40 min.

Run model scripts with `uv run` (deps are declared inline in each script) and in the
background: renders take 2-6x real time, longer when the Mac swaps.

## Voices

A voice is `<name>.wav` + `<name>.txt` (exact transcript). Lookup: `$PERFORM_VOICES`,
then `./voices` in the current directory, then the bundled `praporshchik`, `girl`, `starik`.

- Design one: `uv run $S/design_voice.py NAME "English description" --line "Русская фраза в характере"`.
  Fish copies the reference's delivery, not only its timbre: describe personality and
  mannerisms (drawls, giggles, speaks fast when excited), and write the line in character.
- Record the user's own: `python3 $S/record_refs.py` needs a real terminal (space to start
  and stop). Run it in the user's terminal tab, never in a background shell.
- Never clone a real person's voice from a clip without their consent; design a character instead.

## Engines

`--engine drama3` (default: Fish Drama 3, 3-bit, about real time line by line) or
`--engine s2` (Fish S2 Pro, ~3x slower). Same tags, same voices.

## Render

One voice: steps below. Several characters: write a scene, one turn per line
(`voice: text`, `{pause N}` for silence), and run `uv run $S/scene.py scene.txt out.wav`.
It also writes `out.timeline.json` with each turn's start and end in seconds.

1. Write the tagged text to a `.txt` file in the user's working directory. Blank lines split
   paragraphs; each paragraph is one model call (one call stops at ~47 s of audio).
2. `uv run $S/speak.py script.txt out.wav --voice NAME [--speed 1.1]`.
   `--speed` changes tempo and keeps pitch (ffmpeg atempo); default 1.1.
3. Send the wav to the user. Report audio length and render time, nothing else.

## Tags

Free-form `[tag]` text passes to the model as written. Tested by ear:

- Laugh: `[bursts out laughing] [pause] Текст! [laughs uncontrollably]`. Sounds real.
- Never spell `ха-ха`: it is read aloud as a word.
- `[laughing]`, `[laughing tone]`, `[giggles]` alone: weak or no laugh.
- Questions come out flat without help: tag the delivery, e.g. `[provocative, rising intonation]`,
  `[challenging]`, `[sarcastic question]`.
- Others: `[sigh]` `[whisper]` `[shouting]` `[excited]` `[sad]` `[angry]` `[surprised]`
  `[chuckle]` `[inhale]` `[pause]` `[short pause]` `[emphasis]`.

## Licence

Fish S2 Pro and Drama 3 weights are under Fish Audio licences (research / community), not open
for commercial use.
Say so if the user mentions selling or publishing the audio commercially.
