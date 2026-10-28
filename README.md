# iorlas-perform

Local Russian text-to-speech on Apple Silicon, as a Claude Code plugin. Write text with
ElevenLabs-style tags, get a wav in a cloned or designed voice, laughs included.

```
[excited] Так, рядовой, стоять! [bursts out laughing] Он аж папочку уронил! [laughs uncontrollably]
```

Engines: [Fish Drama 3](https://huggingface.co/fishaudio/drama-3) (default, 3-bit MLX) or
[Fish Audio S2 Pro](https://huggingface.co/fishaudio/s2-pro), via
[mlx-audio](https://github.com/Blaizzy/mlx-audio). Voice design:
[Qwen3-TTS VoiceDesign](https://huggingface.co/mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16).

## Install

```
/plugin marketplace add iorlas/iorlas-marketplace
/plugin install iorlas-perform@iorlas-marketplace
```

Needs an Apple Silicon Mac with 32 GB+ RAM, `uv` and `ffmpeg`. Nothing downloads at install:
each model downloads to `~/.cache/huggingface` on its first use, with a log line saying so
(Drama 3 19.8 GB, S2 10 GB, Qwen VoiceDesign 4.5 GB).

## Use

Three skills, around **profiles**:

- `scenario`: writes or fixes a script with radio-drama craft (who speaks, where, when; scenes
  that end on a beat), in the Markdown format below, and lints it.
- `/perform`: renders a ready scenario (given only an idea, it runs `scenario` first). Casts voices
  (designing new ones when needed), shows you the text, and on your yes renders a wav plus
  `timeline.json`.
- `voice`: one voice reading a text, voice design, recording your own voice.

Or run the scripts yourself:

```bash
uv run scripts/speak.py examples/shmatko.txt out.wav --voice praporshchik
uv run scripts/scenario.py story.md                               # lint a script
uv run scripts/scene.py examples/cherdak.txt cherdak.wav          # multi-voice + timeline
uv run scripts/scene.py examples/night_shift.md night.wav         # ambience beds, sound effects
uv run scripts/design_voice.py boss "A tired 40-year-old Russian office manager, dry sarcasm" --line "Ну и кто это опять сломал?" --profile my-series
uv run scripts/scene.py story.md story.wav --clips clips/       # also save each turn
uv run scripts/calibrate.py clips/ --profile my-series          # per-voice levels
python3 scripts/record_refs.py
```

| script | job |
|---|---|
| `speak.py` | tagged text -> wav, voice cloned from one reference |
| `profiles.py` | list, show and copy profiles |
| `calibrate.py` | per-voice loudness (LUFS) and pitch from rendered clips -> profile `levels.json` |
| `scenario.py` | scenario format parser and lint: every voice named, every scene placed |
| `scene.py` | scenario -> wav + `timeline.json`, one render per turn, progress with ETA |
| `ambience.py` | background beds (`office`, `kitchen`, `evening`, `night`, `rain`, `wind`), crossfade, ducking |
| `sfx.py` | one-shot sound effects: phone, modem, door, kettle, lighter, messenger sounds |
| `master.py` | final loudness: episode to -16 LUFS, true peak -1 dBTP (`scene.py --loudness`) |
| `engines.py` | engine list (`--engine drama3\|s2`), first-use download log |
| `design_voice.py` | voice from a text description |
| `record_refs.py` | guided recording of your own voice, space to start/stop |

Voices are `<name>.wav` + `<name>.txt` (transcript), looked up in the scenario's profile
`voices/`, then `$PERFORM_VOICES` (else `./voices`), then the bundled `narrator`, `vadik`, `rajesh`, `praporshchik`, `girl`, `starik`
(designed with Qwen VoiceDesign).

## Profiles

A profile is one series or world in a folder: what the series is and how it should sound,
the world, the characters, their voices, per-voice levels, and the episodes so far.

```
profiles/<name>/
  profile.md     format, tone, humour, acting and writing preferences
  world.md       setting, rules, running gags, canon so far
  characters.md  cast table and how each character sounds
  levels.json    per-voice loudness gain and pitch (calibrate.py)
  voices/        voice files for the cast
  episodes/      NN-slug.md scenarios
```

`scenario` reads the profile before writing an episode and updates it after; `scene.py` takes
voices from the profile of the file it renders. Your profiles live in `$PERFORM_PROFILES` or
`./profiles`. The bundled [`senior-vadik`](profiles/senior-vadik) profile is a complete example:
a comedic Russian series about a fake senior engineer and an AI genie, three episodes in.

```bash
uv run scripts/profiles.py                    # list profiles
uv run scripts/profiles.py new my-series      # start a profile from a template
uv run scripts/profiles.py copy senior-vadik  # copy the example into ./profiles
uv run scripts/scene.py profiles/senior-vadik/episodes/02-tri-zhelaniya.md ep2.wav
```

## Scenario format

A Markdown file that reads as a script on GitHub or in any editor:

```markdown
# Сеньор Вадик

## Cast

| voice | who |
|---|---|
| vadik | Вадик, 28, тимлид третью неделю |
| palych | Геннадий Палыч, IT-директор |

## Офис, утро

> ambience office

- narrator: [calm, storyteller] Утро. Офис. Вадик третью неделю тимлид.
- palych: [loud] Вадим! Тимлид без команды — это просто лид!
- vadik@0.2: [nervous, too fast] Сделаем, Геннадий Палыч.
- {pause 1}
```

- The cast table names each voice. The lint checks every character is named before or in
  their first line, and again when they return after a scene away.
- Each `##` heading is a scene: a scene pause and a background bed from `> ambience NAME`
  (see Ambience).
- Only list items are read aloud, with inline metadata: `[acting tag]`, `voice@N:` for the gap
  before a turn (negative overlaps), `{pause N}`.
- Joke map: `<!-- plant: KEY -->` before a setup line, `<!-- payoff: KEY -->` before its
  payoff. A payoff with no plant earlier in the episode is a lint error; the lint also warns
  when an episode has more scenes than its length can carry (about 0.7 per minute).
- Older `.txt` scene files (one turn per line) still render.

## Ambience

`> ambience night` under a scene heading puts a bed under the scene: it crossfades from the
previous bed over 1.5 s and is fully up as the scene's first turn starts. `ambience rain 0.5`
sets volume (1 = default); a scene without ambience fades the bed out. Beds sit 21 dB under the
speech and duck 9 dB more while anyone talks. `{ambience NAME}` or `{ambience off}` changes the
bed mid-scene. `- voice+phone: text` renders a turn through a telephone band. See
[examples/night_shift.md](examples/night_shift.md).

| bed | for | sounds |
|---|---|---|
| `office` | office, open space, day | chatter, keyboards, air conditioner |
| `kitchen` | kitchen, flat, home | fridge hum, TV through the wall |
| `evening` | evening, outside, city | traffic, a few crickets |
| `night` | night, outside or by a window | crickets, distant cars, wind |
| `rain` | rain, street, courtyard | rain in a Saint Petersburg courtyard |
| `wind` | outdoors, storm, roof | gusts |

Beds are synthesized in numpy, nothing downloads: shaped noise for air conditioning, rain,
wind and traffic, tones for crickets and hum, the bundled voices layered and muffled for
office chatter and a TV next door. Preview one: `uv run scripts/ambience.py office 10 office.wav`.

## Sound effects

`- {sfx phone_ring}` between turns plays an effect after the previous turn, spaced like a turn;
the next turn follows it. `- {sfx modem 0.6 @-1.5}` sets volume (1 = default, 8 dB under the
speech) and gap: a negative gap starts it before the previous turn ends. To speak over an
effect, give the next turn a negative gap. The lint warns when a line promises a sound
(«звонит телефон», «стук в дверь», «подключаемся к интернету») with no `{sfx}` next to it.

`phone_ring`, `phone_vibrate`, `modem` (dial-up handshake), `door_open`, `door_close`,
`door_knock`, `keyboard`, `notify`, `uh_oh` (a messenger "uh-oh" in the spirit of ICQ),
`call_join`, `lighter` (lighter and a drag), `kettle`, `cash_register`, `error_beep`.
All synthesized, like the beds; the messenger and call sounds are look-alikes, not samples.
List and preview: `uv run scripts/sfx.py`, `uv run scripts/sfx.py modem modem.wav`.

## Tag guide

First tested by ear on Fish S2 Pro; Drama 3, the default, won the A/B and has rendered every
tag below in the example episodes since:

- Laugh: `[bursts out laughing] Текст! [laughs uncontrollably]`. Sounds real.
- Never spell `Ха-ха`: it is read aloud as a word.
- `[laughing]`, `[laughing tone]`, `[giggles]` alone: weak or no laugh.
- Questions (not yet judged by ear): tag the delivery, e.g. `[provocative, rising intonation]`.

## Roadmap

- Per-word timings in `timeline.json` (forced alignment).

## Licence

Code: MIT. Model weights are not in this repo; Fish S2 Pro and Drama 3 are under Fish Audio
licences (non-commercial), Qwen3-TTS under Apache 2.0.
