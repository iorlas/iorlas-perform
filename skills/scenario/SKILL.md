---
name: scenario
description: Write or fix a script for an audio story, radio play or narrated multi-voice scene, inside a profile (a series folder with its world, characters, voices, preferences and past episodes), using radio-drama craft so a listener with closed eyes always knows who speaks, where and when, and no scene feels cut off. Output is a lint-clean Markdown scenario file (.md: cast table, a ## heading per scene, turns as list items with inline tags), ready for /perform. Use for "write a scenario", "next episode", "script this story", "fix this script", "start a new series/profile", or as step 1 of /perform. For rendering, use perform; for a single voice reading text, use voice.
---

# scenario

Profile -> premise -> cast -> scene plan -> turns -> lint -> self-check -> approval -> canon.
Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below. The rules with sources are in
`${CLAUDE_SKILL_DIR}/craft.md`; the tag guide is in the `voice` skill. This skill holds the
craft that holds for any story; everything about one series lives in its profile.

## 0. Profile

A profile is a folder for one series or world (`$S/profiles.py` documents it):

```
profiles/<name>/
  profile.md     format, tone, humour, acting and writing preferences, render settings
  world.md       setting, rules of the world, running gags, canon so far
  characters.md  cast table (voice | who) and how each character sounds: tics, fillers, accent
  levels.json    per-voice loudness gain and pitch, from calibrate.py
  voices/        the cast's voice files
  episodes/      NN-slug.md, in order; 00-intro.md if the series has an intro
```

- `uv run $S/profiles.py` lists profiles: `$PERFORM_PROFILES`, `./profiles`, then the bundled
  examples (read-only; `profiles.py copy NAME` copies one into `./profiles`).
- Pick the profile the user names. With none named and one existing, use it; with several, ask.
- A new series gets a new profile, in this order:
  1. `uv run $S/profiles.py new NAME` makes `./profiles/NAME/` (or under `$PERFORM_PROFILES`)
     with template `profile.md`, `world.md`, `characters.md`. `profile.md` marks the folder
     as a profile; scripts find voices and levels by it.
  2. Fill the three files from what the user says; ask only about what changes the story
     (tone, audience, length, intro or not).
  3. Design each character's voice into it: `design_voice.py NAME "..." --line "..." --profile NAME`.
  4. Write episodes inside `episodes/`, so the renderer finds the profile. An intro, if the
     series has one, is `episodes/00-intro.md` with `<!-- lint: jingle -->`; `scene.py` plays it
     before every episode.
  5. After the first render, calibrate levels (perform, step 5).
- To build on the bundled example, `profiles.py copy senior-vadik` first: an installed plugin's
  folder is replaced on update.
- Read `profile.md`, `world.md`, `characters.md` and the last two episodes before writing.
  The profile's preferences override this skill's defaults where they conflict.
- The bundled `senior-vadik` profile is a full example: copy its shape, not its jokes.

## Format

A Markdown file, `<name>.md`, that reads as a script when rendered:

```markdown
# Сеньор Вадик. Часть 2: Три желания

<!-- profile: senior-vadik -->

## Cast

| voice | who |
|---|---|
| vadik | Вадик, 28, тимлид третью неделю, битард под прикрытием |
| palych | Геннадий Палыч, IT-директор, бывший начальник склада |
| mikhalych | Михалыч, старый сисадмин, курит у сервера Зинаида |

## Офис, утро

> ambience office

- narrator: [calm, storyteller] Утро. Офис. Вадик третью неделю тимлид.
- palych: [loud] Вадим! Тимлид без команды — это просто лид!
- vadik@0.2: [nervous, too fast] Сделаем, Геннадий Палыч.

## Курилка, вечер

> ambience wind

- narrator: [warm, ironic] Вечер. Курилка. Михалыч, старый сисадмин, курил на ветру.
```

- `# Title`, then `## Cast`: a table of every voice except `narrator`, `voice | Имя, кто это`.
  The words before the first comma are the names the lint looks for in the text. The voice
  name is the voice file name.
- Every other `## heading` is a scene, titled with place and time. The renderer adds a scene
  pause before it. The heading is never read aloud, so the narrator still says where and when.
- `> ambience NAME [volume]` under a scene heading sets its background bed: `office`,
  `kitchen` (flat, home), `evening` (city, outside), `night`, `rain` (street, courtyard), `wind`.
  `> ambience night 0.5` is half volume. A scene without one fades the bed out.
- `- voice+phone: Текст`: a turn heard through a phone. `- {ambience NAME}` changes the bed
  mid-scene.

### Sound effects

When a line promises a sound, give it one: «звонит телефон» -> `- {sfx phone_ring}` right
before or after that turn. The effect plays after the previous turn and the next turn waits
for it; `- {sfx modem 0.6 @-1.5}` = 60% volume, starting 1.5 s before the previous turn ends.
For a line over the effect («Вадим, у тебя телефон звонит!»), give that turn a negative gap.
Effects: `phone_ring`, `phone_vibrate`, `modem`, `door_open`, `door_close`, `door_knock`,
`keyboard`, `notify`, `uh_oh` (ICQ-style), `call_join` (someone joins a call), `lighter`,
`kettle`, `cash_register`, `error_beep`. The lint warns about a sound cue with no effect
nearby; one or two effects per scene is plenty. The senior-vadik episodes in
`profiles/senior-vadik/episodes/` show them in use: calls, Zoom, keyboards, a lighter, a door.
- Turns are list items, `- voice: Текст`, with the metadata inline:
  `[delivery tag]` for acting, `voice@N:` for the gap before (negative overlaps), and
  `- {pause N}` for a deliberate beat inside a scene (at most 3 s).
- Notes for the writer go in `<!-- comments -->` or plain paragraphs; only list items are
  read aloud. A turn written outside a list is an error, so no line goes missing.

## 1. Premise

From the profile's world and canon, write down in 3 lines: what the hero wants, what goes
wrong, the twist. Every episode stands alone: a listener who missed the last one must follow it.

## 2. Cast

- Take characters from `characters.md`; copy their rows into the episode's `## Cast`. A new
  character gets a row there too, and a voice (`design_voice.py --profile NAME`).
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
- **Acting inside a line.** A turn is a performance, not a flat sentence. Change tone
  mid-phrase with a tag where the change happens:
  `[polite] Конечно, Геннадий Палыч, [suddenly furious] но я вам не нейросеть!`.
  Use punctuation as intonation anywhere in the line: `!` mid-sentence for a jolt, `?!`
  for outrage, `...` for a trailing hesitation, `—` for a cut-off or a turn of thought.
  Aim for at least one shift or jolt in every few lines; a scene of evenly delivered lines
  sounds read, not played.
- **Fillers.** Live speech has them; give dialogue (never narration) Russian fillers:
  «ну», «короче», «слушай», «блин», «типа», «как бы», «это самое», «значит», «вот»,
  «ага», «да ладно», «ой», «ёлки». Each character gets their own set, which doubles as the
  tic the ear tracks: a boss «так, значит», an old sysadmin «это самое», a young guy
  «короче, типа», a mother «ой». About one per two or three lines, mid-sentence or at the
  start, never inside a punchline. Prefer words over sounds: «э-э» and «ммм» can come out as
  spelled letters.
- **Transitions.** Rising (calm to angry, quiet to loud) works with stepped tags inside one
  turn: `[calm] ... [irritated, louder] ... [shouting] ...`. Falling (joy to sadness, loud to
  quiet) does not: the model stops for a beat at the tag and drops pitch so far that it sounds
  like another person. For a fall, keep it one breath: no `...` or full stop at the turn, a
  bridge word instead («Мам, меня повысили — ну, директором завода»), and one tag for the
  whole arc that ends deflated rather than in tears (`[excited, deflating on the last words]`).
  Heard on Drama 3; the fix for falls is not yet tested.
- **Length.** A character may say several sentences in one turn when the moment wants a
  speech: a rant, a confession, a story. Keep one turn under 300 characters (one render caps
  near 47 s); longer speeches continue in the next turn of the same voice with `@0.1`, and
  the tone can change at the split.
- **Delivery tags** in English on every turn; questions get an intonation tag
  (`[rising intonation]`); laughs as `[bursts out laughing] Текст! [laughs uncontrollably]`;
  no Russian inside brackets, it is read aloud.
- **Accents.** A foreign accent comes from writing that character's Russian in their style of
  Latin transliteration (Indian: `Bhai, oo naas v Bangalore...`), plus an accent tag.

## 5. Lint

```
uv run $S/scenario.py <name>.md
```

Fix every error, then every warning, or keep a warning only when it is intended (say why in
an `<!-- -->` comment). `scene.py` runs the same lint before rendering.

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
Save the episode as `profiles/<name>/episodes/NN-slug.md`, the next number.

## 8. Canon

Once the episode is approved, update the profile so the next episode starts from it:
- `world.md`: one line under "Canon so far"; new running gags or rules of the world.
- `characters.md`: new characters, and what changed about old ones.
- `profile.md`: any preference the user stated while writing or listening ("too many places",
  "more acting"), in their terms. The profile is where preferences live, not memory.
