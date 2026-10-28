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

Two skills:

- `/perform`: give a scenario or an idea. Claude writes the tagged scene, casts voices
  (designing new ones when needed), shows you the text, and on your yes renders a wav plus
  `timeline.json`.
- `voice`: one voice reading a text, voice design, recording your own voice.

Or run the scripts yourself:

```bash
uv run scripts/speak.py examples/shmatko.txt out.wav --voice praporshchik
uv run scripts/scene.py examples/senior_vadik.txt vadik.wav       # multi-voice + timeline
uv run scripts/scene.py examples/night_shift.txt night.wav        # with ambience beds
uv run scripts/design_voice.py boss "A tired 40-year-old Russian office manager, dry sarcasm" --line "Ну и кто это опять сломал?"
python3 scripts/record_refs.py
```

| script | job |
|---|---|
| `speak.py` | tagged text -> wav, voice cloned from one reference |
| `scene.py` | `voice: text` scene -> wav + `timeline.json`, one render per turn |
| `ambience.py` | background beds (`office`, `kitchen`, `evening`, `night`, `rain`, `wind`), crossfade, ducking |
| `engines.py` | engine list (`--engine drama3\|s2`), first-use download log |
| `design_voice.py` | voice from a text description |
| `record_refs.py` | guided recording of your own voice, space to start/stop |

Voices are `<name>.wav` + `<name>.txt` (transcript), looked up in `$PERFORM_VOICES`, then
`./voices`, then the bundled `narrator`, `vadik`, `rajesh`, `praporshchik`, `girl`, `starik`
(designed with Qwen VoiceDesign).

## Ambience

A scene line `{ambience night}` brings in a background bed, crossfading over the 1.5 s
before the next turn, so it is fully up as that turn starts; `{ambience rain 0.5}` sets volume (1 = default), `{ambience off}`
fades out before the next turn. Beds sit 24 dB under the speech and duck 9 dB more while anyone talks. Put the
line before the narrator's scene change ("Ночь. Офис."). `voice+phone: text` renders a turn
through a telephone band. See [examples/night_shift.txt](examples/night_shift.txt).

Beds are synthesized in numpy, nothing downloads: shaped noise for air conditioning, rain,
wind and traffic, tones for crickets and hum, the bundled voices layered and muffled for
office chatter and a TV next door. Preview one: `uv run scripts/ambience.py office 10 office.wav`.

## Tag guide

Tested by ear on Fish S2 Pro (Drama 3 judged better overall in an A/B; its tags not judged one by one):

- Laugh: `[bursts out laughing] Текст! [laughs uncontrollably]`. Sounds real.
- Never spell `Ха-ха`: it is read aloud as a word.
- `[laughing]`, `[laughing tone]`, `[giggles]` alone: weak or no laugh.
- Questions (not yet judged by ear): tag the delivery, e.g. `[provocative, rising intonation]`.

## Roadmap

- Per-word timings in `timeline.json` (forced alignment).
- Overlapping speech: turns that start before the previous one ends.

## Licence

Code: MIT. Model weights are not in this repo; Fish S2 Pro and Drama 3 are under Fish Audio
licences (non-commercial), Qwen3-TTS under Apache 2.0.
