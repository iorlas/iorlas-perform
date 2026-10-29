---
name: voice
description: One speaker reading a Russian text, locally on Apple Silicon, with a cloned or designed voice and ElevenLabs-style inline tags (laughs, sighs, whispers, shouting), via Fish Drama 3 or Fish S2 Pro on mlx-audio. Also designs a character voice from a description, records the user's own voice for cloning, and holds the tag guide and requirements the other skills use. Use for a single voice: a monologue, a narration, a voice sample. Several characters, a scene or an episode go to perform; writing a script goes to scenario. Skip for speech-to-text, cloud TTS, or non-Mac machines.
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
background: Drama 3 renders about real time, S2 about 3x slower, and both are several times
slower when the Mac swaps (another model loaded, a second render running).

## Voices

A voice is `<name>.wav` + `<name>.txt` (exact transcript). Lookup: the scenario's profile
`voices/` (see `scenario`), then `$PERFORM_VOICES` (else `./voices` in the current directory),
then the bundled `narrator`, `vadik`, `rajesh`, `praporshchik`, `girl`, `starik`.

- Design one: `uv run $S/design_voice.py NAME "English description" --line "Русская фраза в характере" [--profile NAME]`.
  With `--profile` it goes into that profile's `voices/`, otherwise into `$PERFORM_VOICES` or `./voices`.
  Fish copies the reference's delivery, not only its timbre: describe personality and
  mannerisms (drawls, giggles, speaks fast when excited), and write the line in character.
- Record the user's own: `python3 $S/record_refs.py` needs a real terminal (space to start
  and stop). Run it in the user's terminal tab, never in a background shell. It records one
  reference per mood (calm, happy, angry, sad, whisper, excited) into `$PERFORM_VOICES` or
  `./voices`; copy the one to use into a profile's `voices/` by hand.
- Start from a consented reference: a real recording gives a timbre the designer cannot reach
  (its "older Russian man" and "young Russian woman" each land on one timbre, whatever the
  words). Use only recordings whose speakers agreed to be cloned:
  - Kyutai Unmute Voice Donation Project, `huggingface.co/kyutai/tts-voices`, folder
    `voice-donations/`: 228 volunteers, CC0. The terms grant reuse "for any purpose (commercial
    or non-commercial)", TTS and voice replicas included, under Kyutai's Acceptable Use Policy.
    Donors may withdraw: keep the source id, and retire a voice whose file leaves the repo.
    No labels (age, sex), mostly English; some have an `_enhanced` (denoised, de-echoed) copy.
  - Mozilla Data Collective, Denis 1.0 and Dmitri 1.0: Russian, one man each, CC0, recorded for
    TTS; no consent wording found, read the dataset card before using them.
  - Refused: Common Voice and LibriVox readings (speakers never agreed to cloning); EARS and
    Expresso are CC BY-NC (no commercial use); VCTK and CML-TTS name no cloning consent.
  The picks, with the user's verdicts, are kept outside any profile in
  the plugin's data folder, `voice-library/catalog.md`
  (`~/.claude/plugins/data/iorlas-perform-iorlas-marketplace/voice-library/`). Screen a collection by pitch, roughness
  (Praat HNR, shimmer) and an age-gender estimate, then by ear: send labelled packs (a spoken
  name before each voice), never a row of unlabelled clips.
- Seed a reference in Russian. An English (or noisy) clip anchors Fish loosely: in Russian, its
  lines drift to other speakers. Cut the clip's pauses to 0.3 s, render one long, expressive
  Russian line from it, keep the take the ear likes, and make that take the reference
  (`<name>.wav` + its Russian text). Lines of one voice then scored 0.79-0.87 against each
  other instead of 0.38. The seed's delivery becomes the voice: a breathy tag made a whisperer.
- Check it apart from the cast: `uv run $S/voice_similarity.py PROFILE --check new.wav`
  (`design_voice.py --profile` does it for designed takes; scenario rule C6).
- Never clone a real person's voice from a clip without their consent; design a character instead.
  A CC0 voice does not change the engine's licence (see Licence).

## Engines

`--engine drama3` (default: Fish Drama 3, 3-bit, about real time line by line) or
`--engine s2` (Fish S2 Pro, ~3x slower). Same tags, same voices.

## Render

One voice: steps below. Several characters, a scene or an episode: use `perform`.

1. Write the tagged text to a `.txt` file in the user's working directory. Blank lines split
   paragraphs; each paragraph is one model call (one call stops at ~47 s of audio).
2. `uv run $S/speak.py script.txt out.wav --voice NAME [--speed 1.1]`.
   `--speed` changes tempo and keeps pitch (ffmpeg atempo); default 1.1.
3. Send the wav to the user. Report audio length and render time, nothing else.

## Tags

Free-form `[tag]` text passes to the model as written. Tested by ear:

- Laugh: `[bursts out laughing] Текст! [laughs uncontrollably]`. Sounds real.
- Never spell `ха-ха`: it is read aloud as a word.
- `[laughing]`, `[laughing tone]`, `[giggles]` alone: weak or no laugh.
- Questions come out flat without help: tag the delivery, e.g. `[provocative, rising intonation]`,
  `[challenging]`, `[sarcastic question]`, one tag per question inside the turn. A spoken
  particle («а?», «перезагрузить-то») makes it sound more real, but only for a character who
  talks that way.
- Same voice, different sound per line: Fish samples every take afresh. `scene.py` seeds each
  voice (one fixed seed per voice name, moved on a retry), so a voice holds together across
  turns and a rerender repeats it; `--free-seed` samples freely. Low temperature or feeding
  earlier takes as history made takes that never end (47 s, no stop).
- Others: `[sigh]` `[whisper]` `[shouting]` `[excited]` `[sad]` `[angry]` `[surprised]`
  `[chuckle]` `[inhale]` `[pause]` `[short pause]` `[emphasis]`.
- Pauses: `[pause]` and `[short pause]` can stretch to 2-4 s; `scene.py` caps silences inside a
  turn at 0.6 s (`--max-silence`). One per turn at most, never inside a punchline.
- Tone changes inside one turn: rising (calm to angry, quiet to loud) works with stepped tags,
  `[calm] ... [irritated, louder] ... [shouting] ...`. Falling (joy to tears, loud to quiet)
  does not: the model stops at the tag and drops pitch so far it sounds like another person.
  For a fall, keep one breath (a bridge word, no full stop at the change) and one tag for the
  arc (`[excited, deflating on the last words]`), or split it into two turns. Drama 3.
- One tag per job: `[cheerful] ... [booming radio ad announcer] ...`, not one tag that
  narrates the change.
- Stress: a combining acute (U+0301) after the stressed vowel fixes a misstressed word,
  «Пи́дора отве́т». Each mark also adds emphasis: only on words heard wrong, two per line at most.
- Length: one render caps near 47 s, about 300 characters; split longer speeches.
- Fillers: words come out as words («ну», «короче», «ой»); sounds like «э-э», «ммм» can come out
  spelled. Numbers, Latin letters and abbreviations («$40k», «QR») may be read oddly: write
  them as said («сорок тысяч долларов», «кьюар-код») when a render gets them wrong.
- Foreign accents: write the character's Russian in their Latin transliteration
  (`Bhai, oo naas v Bangalore...`) plus an accent tag.

## Licence

Fish S2 Pro and Drama 3 weights are under Fish Audio licences (research / community), not open
for commercial use.
Say so if the user mentions selling or publishing the audio commercially.
