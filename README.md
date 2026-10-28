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
| `profiles.py` | where profiles live; list, show, create from the template |
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
its world and entities, the characters and their relationships, their voices, per-voice
levels, and the episodes so far. Profiles are your own work: they live outside this repo, in
the plugin's data folder (`~/.claude/plugins/data/iorlas-perform-<marketplace>/profiles`, kept
across updates) or in `$PERFORM_PROFILES`. Uninstalling the plugin deletes its data folder
unless you pass `--keep-data`, so back it up or set `$PERFORM_PROFILES`.

```
<name>/
  profile.md      format, length, language, tone, intro, acting taste
  world.md        setting, entities, rules, running gags, canon so far
  characters.md   cast, character design, how each one sounds
  relationships.md every pair that makes plots, with a map
  entities/      one soul file per character, object, place; dated facts at the end
  structure.json  optional: tunes the structure lint for the genre
  levels.json     per-voice loudness and pitch (calibrate.py)
  voices/         voice files for the cast
  episodes/       NN-slug.md scenarios; 00-intro.md plays before each
  renders/        rendered episodes
```

```bash
uv run scripts/profiles.py                 # where profiles live, and which exist
uv run scripts/profiles.py new my-series   # a profile with every section the skill reads
```

`scenario` designs an episode from the profile and updates it after; `scene.py` takes voices,
levels and the intro from the profile of the file it renders. See
[skills/scenario/profiles.md](skills/scenario/profiles.md).

## Scenario format

A Markdown file that reads as a script on GitHub or in any editor: a cast table, a `##`
heading per scene with an optional `> ambience NAME`, turns as list items with inline tags,
and design marks the lint reads (`<!-- beat: hook -->`, `<!-- plant: KEY -->`,
`<!-- payoff: KEY -->`). Full syntax: [skills/scenario/format.md](skills/scenario/format.md).
The `scenario` skill holds the writing process and its rules: premise and game, beat sheet,
joke map, scene plan, turns, lint, a script-doctor review, canon.

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
