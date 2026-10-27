# iorlas-perform

Local Russian text-to-speech on Apple Silicon, as a Claude Code plugin. Write text with
ElevenLabs-style tags, get a wav in a cloned or designed voice, laughs included.

```
[excited] Так, рядовой, стоять! [bursts out laughing] [pause] Он аж папочку уронил! [laughs uncontrollably]
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

Ask Claude to voice a text; the `voice` skill runs the scripts. Or run them yourself:

```bash
uv run scripts/speak.py examples/shmatko.txt out.wav --voice praporshchik
uv run scripts/scene.py examples/cherdak.txt scene.wav            # multi-voice + timeline
uv run scripts/design_voice.py boss "A tired 40-year-old Russian office manager, dry sarcasm" --line "Ну и кто это опять сломал?"
python3 scripts/record_refs.py
```

| script | job |
|---|---|
| `speak.py` | tagged text -> wav, voice cloned from one reference |
| `scene.py` | `voice: text` scene -> wav + `timeline.json`, one render per turn |
| `engines.py` | engine list (`--engine drama3\|s2`), first-use download log |
| `design_voice.py` | voice from a text description |
| `record_refs.py` | guided recording of your own voice, space to start/stop |

Voices are `<name>.wav` + `<name>.txt` (transcript), looked up in `$PERFORM_VOICES`, then
`./voices`, then the bundled `praporshchik`, `girl`, `starik` (designed with Qwen VoiceDesign).

## Tag guide

Tested by ear on Fish S2 Pro and Drama 3:

- Laugh: `[bursts out laughing] [pause] Текст! [laughs uncontrollably]`. Sounds real.
- Never spell `Ха-ха`: it is read aloud as a word.
- `[laughing]`, `[laughing tone]`, `[giggles]` alone: weak or no laugh.
- Questions (not yet judged by ear): tag the delivery, e.g. `[provocative, rising intonation]`.

## Roadmap

- `/perform scenario.md`: Claude annotates a plain scenario (speakers, emotions, pauses,
  emphasis), each line is rendered on its own, compiled to one wav plus `timeline.json`
  (per-word timings, overlaps between speakers).

## Licence

Code: MIT. Model weights are not in this repo; Fish S2 Pro and Drama 3 are under Fish Audio
licences (non-commercial), Qwen3-TTS under Apache 2.0.
