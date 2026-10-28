---
name: scenario
description: Write or fix a script for an audio story, radio play or narrated multi-voice scene, using radio-drama craft so a listener with closed eyes always knows who speaks, where and when, and no scene feels cut off. Output is a lint-clean scenario file in the /perform format (@cast, @scene, tagged turns), ready to render. Use for "write a scenario", "script this story", "fix this script", "part 2 of the story", or as step 1 of /perform. For rendering, use perform; for a single voice reading text, use voice.
---

# scenario

Idea -> premise -> cast -> scene plan -> turns -> lint -> self-check -> approval.
Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below. The rules with sources are in
`${CLAUDE_SKILL_DIR}/craft.md`; the tag guide is in the `voice` skill.

## Format

```
# Сеньор Вадик. Часть 2: Три желания
# world: stories/WORLD.md

@cast
vadik     | Вадик, 28, тимлид третью неделю, битард под прикрытием
palych    | Геннадий Палыч, IT-директор, бывший начальник склада
mikhalych | Михалыч, старый сисадмин, курит у сервера Зинаида

@scene Офис, утро | ambience office
narrator: [calm, storyteller] Утро. Офис. Вадик третью неделю тимлид.
palych: [loud] Вадим! Тимлид без команды — это просто лид!
vadik@0.2: [nervous, too fast] Сделаем, Геннадий Палыч.

@scene Курилка, вечер | ambience rain
narrator: [warm, ironic] Вечер. Курилка. Михалыч, старый сисадмин, курил под дождём.
```

- `@cast`: every voice except `narrator`, as `voice | Имя, кто это`. The words before the first
  comma are the names the lint looks for in the text. The voice name is the voice file name.
- `@scene place, time | ambience NAME`: one per scene. The renderer adds a scene pause before it.
  Beds: `office`, `kitchen` (flat, home), `evening` (city, outside), `night`, `rain` (street,
  courtyard), `wind`; `ambience night 0.5` is half volume. No ambience = the bed fades out.
- `voice+phone: Текст`: a turn heard through a phone. `{ambience NAME}` changes the bed mid-scene.
  The header is never read aloud, so the narrator still says where and when.
- Turns: `voice: [delivery tag] Текст`, `voice@N:` for the gap before (negative overlaps),
  `{pause N}` for a deliberate beat inside a scene (at most 3 s). `#` lines are comments.

## 1. Premise

Read the world bible if the story has one (`WORLD.md` next to the scripts or stories) and the
previous episode. Write down in 3 lines: what the hero wants, what goes wrong, the twist.
Every episode stands alone: a listener who missed the last one must follow it.

## 2. Cast

- 3-4 major speaking roles, 6 at most. Each has one tic no one else has: a word («бхай»),
  a rhythm, a running gag. That is how the ear re-identifies them.
- Contrast voices: age, pitch, pace, accent. Two similar voices in a fast exchange need
  attributions.

## 3. Scene plan

Before any dialogue, list scenes as one line each: place, time, who is in it, its purpose,
how it ends. Rules:
- At most 4 speakers per scene. Several short scenes beat one long one.
- Each scene starts mid-action and leaves once its purpose is served.
- Each scene ends on a decision, an image or a reveal; the story's last line is the payoff
  and lands on its last word. Nothing trails off.
- A new scene does not open with the character who closed the last one (the narrator
  is the exception).
- Joke context is planted a scene earlier, never explained inside the joke.

## 4. Turns

- **Who.** A character's name is said, by the narrator or another speaker, before or in their
  first line: «Михалыч, старый сисадмин, курил у сервера». After missing a scene, they are
  named again when they come back. Never assume the listener heard the previous episode.
- **Where and when.** The narrator opens every scene with the place or time and one concrete
  sound or detail: «Ночь. Дождь стучал по подоконнику». The ambience bed does the rest.
- **Narration** like a book, but cut it first when long: scene changes, time jumps, new voices.
  Once two speakers are introduced and trading lines, drop attributions.
- **Pacing.** Line-to-line gaps 0.2-0.4 s (`@0.2`). A beat before a punchline 0.4-0.6 s. No more
  than one `[short pause]` per turn, never inside a punchline: the model can stretch it to
  2-4 s, and `scene.py` caps silences inside a turn at 0.6 s anyway.
- **Comedy.** Setup 1-3 lines, punchline short (under 8 words), the funny word last.
- **Delivery tags** in English on every turn; questions get an intonation tag
  (`[rising intonation]`); laughs as `[bursts out laughing] Текст! [laughs uncontrollably]`;
  no Russian inside brackets, it is read aloud. Turns stay under 300 characters.
- **Accents.** A foreign accent comes from writing that character's Russian in their style of
  Latin transliteration (Indian: `Bhai, oo naas v Bangalore...`), plus an accent tag.

## 5. Lint

```
uv run $S/scenario.py <name>.txt
```

Fix every error, then every warning, or keep a warning only when it is intended (say why in
a `#` comment). `scene.py` runs the same lint before rendering.

## 6. Self-check

Read the script as a listener with closed eyes, then answer each:
1. Can I tell who speaks in every line, from the voice, a name or the tic?
2. Does every scene say where and when in its first narrator line?
3. Does every scene end on a decision, image or reveal, not trail off?
4. Is each joke's context planted before it?
5. Is any line there only for the writer, explaining what the listener already knows? Cut it.
6. Does the last line land on its last word?

## 7. Approve

Show the user the script as readable text (names, no tags) with the cast table, then wait.
Render with `perform` after a yes, or straight away if the user said to render.
