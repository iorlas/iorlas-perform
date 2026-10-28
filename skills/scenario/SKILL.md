---
name: scenario
description: Design and write, or fix, a script for an audio story, radio play or narrated multi-voice episode, inside a profile (a series folder with its world, entities, characters, relationships, voices, taste and past episodes). Works structure first: premise and game, beat sheet, joke map, scene plan, then turns, so a listener with closed eyes always knows who speaks, where and when, and every beat causes the next. Output is a lint-clean Markdown scenario (.md) ready for /perform. Use for "write a scenario", "pilot", "next episode", "script this story", "fix this script", "start a new series/world/profile", or as step 1 of /perform. For rendering, use perform; for a single voice reading text, use voice.
---

# scenario

Design an episode the way a writers' room does, then write it, check it, and record it.

```
0 Profile -> 1 Premise -> 2 Cast -> 3 Beat sheet -> 4 Joke map -> 5 Outline check
  -> 6 Scene plan -> 7 Turns -> 8 Lint -> 9 Doctor -> 10 Approve -> 11 Canon
```

Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below.

| file | holds |
|---|---|
| this file | the process and every rule, numbered (P1, B3, ...) so a review can cite them |
| `${CLAUDE_SKILL_DIR}/format.md` | the file syntax: cast, scenes, turns, ambience, effects, design marks |
| `${CLAUDE_SKILL_DIR}/profiles.md` | where profiles live, their layout, filling a new one, `structure.json` |
| `${CLAUDE_SKILL_DIR}/craft.md`, `structure-research.md` | the sources behind the rules |
| the `voice` skill | delivery tags and what the TTS engine does with them |

This skill is general: it holds for any world. Everything about one series (its language,
tone, how sharp, its intro, its characters) lives in that series' profile, and the profile
wins where they conflict. Numbers marked *tunable* are the lint's defaults; a profile changes
them in `structure.json` for its genre.

## 0. Profile

- P1. `uv run $S/profiles.py` shows where profiles live and which exist. Use the one the user
  names; with none named and one existing, use it; with several, ask.
- P2. A new series or world gets a new profile first: `profiles.py new NAME`, then fill it in
  the order in `profiles.md`. Profiles never go into the plugin's repository.
- P3. Before writing, read `profile.md`, `world.md`, `characters.md` and the last two episodes.
  A profile section that is still a template hint gets filled first, with the user.
- P4. Set the target length (the profile's, or ask) and write it as `<!-- length: N -->`.
  Budget about 11 spoken characters per second: a 4-minute episode is ~2600 characters.

## 1. Premise

- R1. Three lines: what the hero wants, what goes wrong, the twist.
- R2. **The game**, one sentence: the first unusual thing, and the rule "if this is true,
  what else is true?" that every beat heightens. One game per episode, two at most if they
  join at the turn. Five unrelated gags are not a game.
- R3. Each episode stands alone: a listener who missed the others follows it. Nothing outside
  this file (earlier episodes, the series intro) counts as setup.
- R4. A pilot introduces the world's premise and the main pair; it does not use every
  character. Later episodes build on the entities and rules in `world.md`, and obey them.

## 2. Cast

- C1. 3-4 speaking roles, 6 at most (*tunable*), copied from `characters.md` into `## Cast`.
  A new character gets a row in `characters.md` first, and a voice.
- C2. Pick the pair under pressure from the relationships table: the two with the most
  opposite comic lenses. Write down who starts high in status and the line that flips it.
  Status flips at least once in the episode; the best episodes flip it at the turn.
- C3. Each character acts from their design: what they want, their flaw, how they misread
  the world, what they do to the hero. A line none of these explains is cut.
- C3a. Read each cast member's soul file, `characters/<voice>.md`, before writing their lines:
  their core, charm, culture, speech and the lines that are and are not them. Every line
  passes "would only this character say it, this way?". A character without a file gets one
  first (the template in `profiles.md`).
- C4. Every character has a tic the ear tracks: a rhythm or a set of fillers, used every few
  lines. A catchphrase is different: rare, once an episode at most.
- C5. Contrast voices in age, pitch, pace and accent; two similar voices in a fast exchange
  need names said.

## 3. Beat sheet

- B1. Write the episode as a Story Spine first, one line each: "once... every day... but one
  day... because of that... because of that... until finally... and ever since". Every "and
  then" is a broken link: rewrite it as "because of that" or cut the beat.
- B2. Then the beats, with their share of the runtime (*tunable*):

  | beat | share | its job |
  |---|---|---|
  | hook | ~6% | the unusual thing or the want, in the first 15 s: a reason to stay |
  | setup | ~11% | who, the want, the one rule of the world in play; plant what pays off later |
  | incident | ~5% | "but one day": forces the want into action, with a deadline and a cost |
  | ladder | ~46% | 2-4 rungs (2 at 3 min, 4 at 6 min), each the worst result of the last fix |
  | turn | ~17% | the peak and the twist; the plant pays off |
  | button | ~7% | one reaction, then a last line under 9 words, the funny word last |
  | tag | ~7% | optional: a runner once more, or a question to the next episode, then out |

- B3. The ladder gets a reversal near its middle: the hero wins something, falsely, so the
  next rung costs more. A ladder where the hero loses every rung is a plateau.
- B4. A point of no return near three quarters: the exit the hero could take closes.
- B5. The turn is a fair twist: its clue is heard in the first minute and once more before it.
  A payoff the script announces twice is no longer a twist.
- B6. The button is the story's last line and the biggest laugh after the turn; nothing after
  it competes. The tag is the only exception: short, and it never holds a payoff the story
  needs.
- B7. Episodes close and reset by default. A cliffhanger is a question in the tag, never an
  unfinished story.
- B8. Mark every beat in the file with `<!-- beat: NAME -->` before its first line.

## 4. Joke map

- J1. 3-5 big beats that escalate, each caused by the one before. The biggest is at the turn.
- J2. Every callback is planted in this episode, then returns at most twice: an echo that
  changes one thing, and the payoff (*tunable*). The last touch is within ~90 s of the payoff
  (*tunable*), or the listener has forgotten it. Mark them: `<!-- plant: KEY -->`,
  `<!-- echo: KEY -->`, `<!-- payoff: KEY -->`.
- J3. The payoff uses the plant's exact words, so the ear recognises them.
- J4. A series intro's joke never counts as a plant (R3). When an episode calls it back,
  plant it again inside the episode, and not in the same words within the first minute.
- J5. One runner (a small repeated bit) may mirror the game, 2-3 times. The profile's cap on
  running gags includes runners and callbacks.
- J6. The profile's sharpest moments (its spice) are big beats in this map, not extra gags:
  the sharpest at the turn, given to the least likely speaker.
- J7. The empathy beat, if the profile asks for one, is one or two human lines inside a ladder
  rung or at the point of no return, so the turn hurts. Never its own scene, never the button.

## 5. Outline check

- O1. Chain test: delete any middle beat. If the next still works, the deleted beat was a
  topic change: cut it or connect it.
- O2. Send the beat sheet and the joke map, no dialogue yet, to a subagent playing a script
  doctor (step 9's brief). Structure faults found here cost a line; found after the turns,
  a rewrite.

## 6. Scene plan

- S1. Few scenes: about 0.7 per minute (*tunable*), 2-3 for 3-4 minutes. A listener cannot
  see a cut; each costs a reorientation.
- S2. A scene change crosses a threshold: a time jump, a reveal the old room cannot hold, or
  an arrival that is itself the joke. Otherwise the beat comes into the current scene by phone,
  door or a character walking in.
- S3. Beats map onto scenes: hook, setup and incident usually share the first scene; the
  ladder spans the middle; turn and button share the last.
- S4. Every scene moves the game. A scene that only visits a character is folded into one
  that moves it.
- S5. A scene opens with one narrator sentence: the place or time and one concrete sound
  («Ночь. Дождь стучал по подоконнику»). Then dialogue starts mid-action.
- S6. A scene ends on a decision, an image or a reveal. Not on a narrator moral that explains
  what the listener already got.
- S7. At most 4 speakers per scene.

## 7. Turns

- T1. **Who.** A character's name is said, by the narrator or another speaker, before or in
  their first line. After missing a scene, they are named again when they come back.
- T2. **Narration** like a book, dry, ending descriptions on a punchline; cut it first when
  long. Once two speakers trade lines, drop attributions.
- T3. **Register.** Dialogue is spoken language, written as people say it, in the register
  the profile's Language section sets. Never more formal than that.
- T4. **Acting inside a line.** Change tone mid-phrase with a tag where the change happens:
  `[polite] Конечно, [suddenly furious] но я вам не нейросеть!`. Punctuation is intonation:
  `!` mid-sentence for a jolt, `?!` for outrage, `...` for a trailing hesitation, `—` for a
  cut-off. At least one shift or jolt every few lines.
- T5. **Fillers** in dialogue, never narration: each character's set from `characters.md`,
  about one per two or three lines, never inside a punchline.
- T6. **Comedy.** Setup 1-3 lines, punchline short, the funny word last. After a big laugh, a
  short breath (a reaction, a narrator line) before the next setup.
- T6a. **Speed.** People talk at a normal pace, panicking ones too: panic, hurry and
  excitement live in the words, repetitions and breaks («Стой. Стой! Картошку?!»), never in a
  speed tag (`fast`, `too fast`, `rapid`: the lint warns). A rare exception is a
  deliberate gag, marked `<!-- lint-ok: speed tag -->` with the reason.
- T7. **Pacing.** Gaps 0.2-0.4 s between lines (`voice@0.2:`); 0.4-0.6 s before a punchline.
  `{pause N}` only for a deliberate beat, at most 3 s.
- T8. **Length.** A turn may be a speech of several sentences; under 300 characters, longer
  continues in the next turn of the same voice with `@0.1`.
- T9. **Tags** on every turn, in English. Questions get an intonation tag. Tone falls, laughs,
  pauses, stress marks, numbers and accents follow the voice skill's tag guide.

## 8. Lint

```
uv run $S/scenario.py <file>.md
```

Errors stop a render: fix them. Fix every warning, or keep one only when it is intended:
`<!-- lint-ok: words from the warning -->` with the reason in a comment. The lint checks
names, scene openings, the scene budget, beats (present, in order, shares, button length),
callbacks (planted, within reach, three touches), questions, tags, pauses and sound cues.
It cannot check whether anything is funny: that is step 9.

## 9. Doctor

Give a subagent that did not write the script the scenario, the profile and this file, and
this brief: "You are a script doctor. Judge harshly, cite rules by number. Report: the game;
the Story Spine with every 'and then'; each beat against B2-B6; the big laughs and whether
they escalate (J1); each callback (J2-J4); each character against their design (C2-C3);
lines that sound written rather than spoken, with a more casual version only (T3); the three
weakest beats with a fix each; verdict: render or fix first."

- D1. Apply what holds up against the rules and the profile. Refuse any fix that makes a line
  more formal than the profile's register, or that breaks a profile rule.
- D2. Re-lint, and repeat the doctor until it says render or only taste is left; three rounds
  at most, then the user decides.

## 10. Approve

Show the user the script as readable text (names, no tags) with the cast and beat sheet, then
wait. Render with `perform` after a yes, or straight away if the user said to render. Save it
as `episodes/NN-slug.md` in the profile, the next number.

## 11. Canon

Once approved, update the profile so the next episode starts from it:
- `world.md`: one line under "Canon so far"; new entities and rules, as rows.
- `characters.md`: new characters, and what changed about old ones.
- `profile.md`: every preference the user stated while writing or listening ("too many
  scenes", "casual spoken language"), in their words. The profile is where preferences live.

## Fix mode

For an existing script: mark its beats and callbacks (B8, J2), run the lint, run the doctor
(step 9), then apply and re-lint. Keep what works; the user's lines are the user's.
