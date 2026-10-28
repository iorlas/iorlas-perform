---
name: scenario
description: Design and write, or fix, a script for an audio story, radio play or narrated multi-voice episode, inside a profile (a series folder with its world, entities, characters, relationships, voices, taste and past episodes). Works structure first: premise and game, beat sheet, joke map, scene plan, then turns, so a listener with closed eyes always knows who speaks, where and when, and every beat causes the next. Output is a lint-clean Markdown scenario (.md) ready for /perform. Use for "write a scenario", "pilot", "next episode", "script this story", "fix this script", "start a new series/world/profile", or as step 1 of /perform. For rendering, use perform; for a single voice reading text, use voice.
---

# scenario

Design an episode the way a writers' room does, then write it, check it, and record it.

```
0 Profile -> 1 Premise -> 2 Cast -> 3 Beat sheet -> 4 Joke map -> 4a Story map -> 5 Outline check
  -> 6 Scene plan -> 7 Turns -> 7b Punch-up -> 8 Lint -> 8a Listener check -> 9 Doctor -> 10 Approve -> 11 Canon
```

Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below.

| file | holds |
|---|---|
| this file | the process and every rule, numbered (P1, B3, ...) so a review can cite them |
| `${CLAUDE_SKILL_DIR}/format.md` | the file syntax: cast, scenes, turns, ambience, effects, design marks |
| `${CLAUDE_SKILL_DIR}/ledger.md` | every line a listener stumbled on, its cause and the rule it produced: read before writing; add each new one |
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
- P3. Before writing, read `profile.md`, `world.md`, `characters.md`, `relationships.md`,
  `arcs.md` and the last two episodes.
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
- R3a. **Three cycles.** An episode is a complete cycle; it also takes one step of the
  season's cycle, and the season one step of the series' (`arcs.md`). Each episode plants at
  most two season guns (`<!-- arc: KEY -->`), each a joke or a fact that works in this episode
  on its own, so a new listener misses nothing, and fires at most two open ones. A fired gun
  is re-planted in the episode (R3, J4), so its payoff never needs the earlier one.
- R4. A pilot introduces the world's premise and the main pair; it does not use every
  character. Later episodes build on the entities and rules in `world.md`, and obey them.
- R5. **Premise test.** Said as one sentence to someone who knows the series, the logline
  gets a laugh by itself, and it runs on the series' engine (the profile's Engine line: what
  every episode is about, the source of most jokes). A premise that needs the episode to be
  funny, or uses the engine as decoration (an IT series whose plot could happen in a bakery),
  is refused. A small moral story is not a premise: the stakes escalate.
- R5a. **The founding act is motivated on stage.** The hero's first lie, wish or choice, the
  one the premise runs on, gets in the setup: why he did it, how it grew to what it is now, and
  why he keeps it. The listener hears all three; none comes from the logline or a comment.
  Each is consistent with every fact the script states: a checkable fact that breaks a motive
  (a lie about a thing that did not exist yet) is a plot hole, however good the joke.

## 2. Cast

- C1. 3-4 speaking roles, 6 at most (*tunable*), copied from `characters.md` into `## Cast`.
  A new character gets a row in `characters.md` first, and a voice.
- C2. Pick the pair under pressure from `relationships.md`: the two with the most
  opposite comic lenses. Write down who starts high in status and the line that flips it.
  Status flips at least once in the episode; the best episodes flip it at the turn.
- C3. Each character acts from their design: what they want, their flaw, how they misread
  the world, what they do to the hero. A line none of these explains is cut.
- C3a. Read the soul file, `entities/<id>.md`, of every character and entity the episode
  uses before writing: core, charm, culture, milieu, speech, the lines that are and are not
  them. Every line passes "would only this character say it, this way?". Every entity that is
  more than a name in the story (a character, an object like a server, a place like a
  factory, an institution like a company) gets a soul file first (template in `profiles.md`).
- C3b. **Edge is closeness to the culture that makes the character**: the words, habits,
  rituals, cruelties and references of their real milieu, said the way such a person really
  says them. A mother's edge is the blunt remark about his weight at the table; a sysadmin's,
  the verdict on a pipe; an imageboard user's, the thread. Explicit language is one tool of
  it, never the whole, and the soul file sets it per character:
  - **Kit**: their own words, not "swearing" in general.
  - **Dose**: how often, per scene and per episode.
  - **Targets**: at things, at situations, at people, at themselves.
  - **Never with**: who they never swear in front of. Breaking it, or nearly (the boss walks
    in mid-word), is where the joke is.
  - **Stance**: some characters are against it: polite, of higher standing, or feeling so (a
    mother, a courteous boss, a snob). They never swear; their edge comes from their culture,
    and their reaction to someone else's word is a tool («Не выражайся!»).
  - **Source**: a character with no language of its own (an AI, a child, a parrot) has no
    swear words; what it says, it learned from someone in the story, and it says where.
  - **Function**: a verdict, a sigh, an order or a quote, usually one word per line. A full
    stream is for a real peak, from a character whose milieu explodes that way (a boss at
    3 a.m.), and it stays until something in the scene changes the mood. Cut a word if the
    line loses nothing.
- C3c. **Every line is a speech act with a reason**: said to someone, for something, the way a
  person would. A tonal switch (a shout, then calm) needs a cause in the scene; a device is
  never the cause.
  The profile's sharpest moment goes to the least likely mouth that its rules allow (J6).
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
  | turn | ~17% | the peak and the twist; the plant pays off; the biggest laugh, never sentiment |
  | button | ~7% | one reaction, then a last line under 9 words, the funny word last; it pays off the game |
  | tag | ~7% | optional: a runner once more, or a question to the next episode, then out |

- B3. The ladder gets a reversal near its middle: the hero wins something, falsely, so the
  next rung costs more. A ladder where the hero loses every rung is a plateau.
- B4. A point of no return near three quarters: the exit the hero could take closes.
- B5. The turn is a fair twist: its clue is heard in the first minute and once more before it.
  A payoff the script announces twice is no longer a twist.
- B6. The button is the story's last line and the biggest laugh after the turn; nothing after
  it competes. The tag is the only exception: short, and it never holds a payoff the story
  needs.
- B7. Episodes close their story. What carries over is the season's step (R3a), never an
  unfinished plot; a cliffhanger is a question in the tag at most.
- B8. Mark every beat in the file with `<!-- beat: NAME -->` before its first line.

## 4. Joke map

- J0. **Density.** Comedy is a laugh every 15-20 seconds, about 3 a minute (*tunable*:
  `laugh_gap`, `laughs_per_min`). Plan them in the map, then mark every line meant to get one
  with `<!-- laugh: WHAT -->` (what the joke is, in a few words); the lint counts them and
  reports every gap. A line either sets up a laugh, lands one, or moves the plot in a way
  the next laugh needs; a scene of plot-only lines is rewritten. Vary the joke types (literal
  misreading, status reversal, a specific absurd detail, an insult, a callback, a sound) so
  the map is not one trick repeated.
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
  rung or at the point of no return, so the turn hurts. Never its own scene, never the button,
  never the turn: a tender turn kills the peak laugh. Undercut it within one line.
- J8. **The game escalates by different gags.** Each rung shows the game in a new way, so the
  listener cannot guess the next joke from the last one. A game that has one joke (an old
  trope, a single twist the ear sees coming) is a sketch, not an episode.

## 4a. Story map

The episode's logic as a graph, written before the turns into the file's `## Map` table (syntax
in `format.md`). Every want, fear, fact, rule of the world, lie, act, choice, plant, reveal and
turn is a node. Each answers four questions, and the lint checks all four, so a hole is found
before a line is written:

| question | column | what the lint checks |
|---|---|---|
| **why** (motive) | `because` | an act, lie, choice, reveal, turn or payoff names its causes; each exists |
| **when** (order) | `shown` | every cause, and every thing a character must know, is heard in the same scene or an earlier one |
| **who knows** (knowledge) | `who`, `knows` | what a character acts on reached them first: the node it came from is in the map and comes no later |
| **how** (means) | `via` | the way it reaches them is possible: no one in the room who is only on the phone; no phone with nobody on it |

- M1. **Why.** Every act has a reason: a character's want or fear, a fact, a rule, an earlier
  act. "Because the plot needs it" is not a node.
- M2. **Shown, or later.** A node is heard in a scene of this episode, or it is
  `later: WHERE`: justified by what a later scene or episode reveals (a season gun in
  `arcs.md`). Never only in a comment or the logline (R5a).
- M3. **When.** Effects never come before their causes. A time jump is a node of its own
  («прошло восемнадцать лет»), or the listener cannot tell the backstory from now.
- M4. **Who knows.** For every act, ask how the actor knows what they act on, and put the
  source in `knows`: an AI that greets the hero by name saw the name somewhere; a mother who
  asks for the boss by name heard it. A character never acts on what only the listener knows.
- M5. **How.** For every act, ask how it physically happens (`via`: room, phone, screen,
  chat, memory, narration). Someone on the phone cannot see or touch; a message needs a
  channel that still works in this story.
- M6. **Nothing for nothing.** A want, fear, fact, rule or plant that nothing follows from is
  an unfired gun: fire it, mark it `arc`, or cut it.
- M7. **Facts agree.** No two nodes contradict (a lie about a thing that did not exist yet).
  The lint cannot see this; the doctor checks it, node by node.
- M8. Keep it short: the 15-45 nodes the story turns on, not every line. When a review or the
  user finds a hole, add the node that would have caught it.
- M9. **What the listener knows.** `knows` is what a character knows; `needs` is what the
  listener must already have heard for a laugh to work. For every laugh, ask: what does this
  line take for granted? A power («она видит его телефон»), a past event («он его забанил»),
  a reference. Each is a map node, told in a line before the laugh; `<!-- needs: ids -->` on
  the laugh, `<!-- shows: id -->` on the telling line when both are in one scene. A
  prerequisite with no node is the hole: add it, and the line that tells it.

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
- T10. **Heard once.** The listener hears each line once, without the map, the comments or
  the writer's intent. A reply to a question is heard as its answer: its first words answer
  it, or dodge it in a way the listener hears as a dodge. A change of subject says its own
  verb, never an ellipsis: after «А внутри что?», «И ещё один телефон: вашей маме» is heard
  as "inside is another phone"; «Ещё поставила вашей маме» is not. A line whose meaning
  needs its comment or the map fails. A reference is named in full the first time: «как в
  торте «Наполеон»», not «как «Наполеон»», which is heard as the emperor.
- T11. **Say the link, leave the conclusion.** A joke is a chain: A, so B, so the absurd C.
  The listener may finish the last step in their head (taste: deflation by a checkable fact),
  never a middle one. Every link a joke stands on is said in words, with its verb: «Вадик
  честно посчитал Двач» drops the link (counted it as what? since when?), so the ear gets a
  riddle; «с шестнадцати лет он каждую ночь сидел на Дваче. Его он и записал в стаж» says
  it, and «Двенадцать лет в высоконагруженном проекте» then lands. Test: retell the joke to
  someone in one sentence; every word the retelling needs that the line lacks is the hole.
- T12. **Spoken length.** People on TV talk in full sentences and explain themselves, then hit
  short: in «Волшебный участок» about half the sentences are 1-3 words and 8% are 10 or more,
  and half the turns are 10+ words. Setups get whole spoken sentences, with the redundancy
  speech has (repeating the noun, «то есть», «короче», «в смысле»); only the punch is short.
  A script of fragments («Так. Значит. Клиент.») reads fine and is lost by ear. The lint warns
  past 55% short sentences or under 5% long ones in dialogue (*tunable*: `clipped_max`,
  `long_min`); a character whose tic is fragments (Палыч) keeps it, the others carry the length.
- T13. **Speech word order.** A statement never opens with a question word: «Что это, она не
  знала» is voiced as a question that stops halfway. Say «Она не знала, что это». The lint
  warns on a sentence that starts with что, кто, как... and ends with a full stop. Two nouns
  never touch when they are not one phrase: «мой сеньор интеллект внедрил» is heard as «сеньор
  интеллект»; the verb goes between them, «мой сеньор — внедрил интеллект».
- T14. **The punch gets its own delivery.** A punch that turns against its setup (a warning
  that ends as an insult, a boast that ends as a confession) is its own turn with its own tag
  and a gap: one tag over the whole turn voices the punch like the setup, and `[beat]` alone
  does not change it. «Так что думай, что говоришь.» / `[dry, offhand]` «Хотя ты не умеешь.»
  A small turn (polite to needling) takes a new tag inline; a reversal (warning to insult)
  takes its own turn. A deadpan narrator is the exception: the even voice is the joke.
  `listen.py rules` has a fresh reader check T13-T15 over every line; its findings are
  judged, not applied: about half are wrong (narrator lines, a mother's care read as insult).
- T15. **Every choice says its reason.** When a character picks a thing (a source, a person,
  a tool), the line says why that one and where it comes from, unless the listener already
  heard it: «Добавь письма Палыча!» is a riddle (what letters? why his?); «у меня в почте
  письма от Палыча, официальные, штук сто. На них учи!» carries it. A choice's reason is an
  `act`'s `because` in the map, and it is heard, like a laugh's `needs`.

## 7b. Punch-up

The writers' room pass, after the turns are written and before the lint. A subagent that did
not write the turns gets the script, the profile and the soul files, and this brief: "You are
a punch-up writer. For every line: laugh, setup, plot, or flat. For every flat line and every
weak laugh, write three funnier versions in the character's voice and culture, spoken
register, then pick one. Find the three places with the longest stretch without a laugh and
add one. Check the turn is the biggest laugh and the button pays off the game." Apply what
keeps the structure and the character rules; mark the new laughs.

- U1. A punchline is short and specific: a real brand, a number, a name, a ritual from the
  character's milieu beats a general word.
- U2. A narrator line is a joke or it is cut: dry, ending on the funny word, never explaining
  what the listener already got.
- U3. The hero acts: digs deeper, bluffs, schemes, escalates. A hero who only reacts or
  confesses leaves the comedy to everyone else.

## 8. Lint

```
uv run $S/scenario.py <file>.md
```

Errors stop a render: fix them. Fix every warning, or keep one only when it is intended:
`<!-- lint-ok: words from the warning -->` with the reason in a comment. The lint checks
names, scene openings, the scene budget, beats (present, in order, shares, button length),
callbacks (planted, within reach, three touches), questions, tags, pauses and sound cues.
It cannot check whether anything is funny: that is step 9.

## 8a. Listener check

The lint trusts the map's `shown`; the listener check does not. It asks a reader who has only
the spoken lines where each fact a laugh `needs` is said aloud.

```
uv run $S/listen.py run <file>.md
```

`run` hands the brief to a fresh `claude -p` session with no settings, tools, memory or
project files: a reader who saw the notes "gets" what a listener does not. Without the
`claude` CLI, `listen.py brief <file>.md > brief.md`, give `brief.md` alone to a fresh
subagent (no script, profile or summary), save its JSON, and run
`listen.py check <file>.md answers.json`.

An error is a laugh resting on a fact no spoken line tells before it: add the line that tells
it (M9), or cut the laugh. A warning is what the reader did not get on one hearing (T10): fix
it, or keep it with the reason. Run it again after fixing.

## 9. Doctor

Give a subagent that did not write the script the scenario, the profile and this file, and
this brief: "You are a script doctor. Judge harshly, cite rules by number. First: is it funny?
Mark every line laugh / setup / plot / flat, count the laughs per minute against J0, and say
whether the premise passes R5. Check the `## Map` against the turns (M1-M9): a motive, a source of knowledge or a
channel the map claims but no line says, a fact that contradicts another, an answer that does
not answer the line before it. Test each laugh against the profile's "Taste, calibrated"
rules by number: who loses status, and did they earn it? Listen test (T10): read the turns
with the map and comments hidden; for every reply to a question, write what a listener hears
it answer, and for every line, what it means heard once; list each line where that differs
from its comment. Then report: the game;
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
- `arcs.md`: this episode's season step; every `arc` gun it planted under Open guns, every
  one it fired moved to Fired.
- `world.md`: one line under "Canon so far"; new entities and rules, as rows.
- `characters.md`: new characters. A new entity mentioned more than once gets a soul file.
- **Facts**, never rewrites: what the episode established about an entity or a pair (a new
  past, a habit, a name, a change between two characters) is one dated line, with the episode
  as source: `profiles.py fact NAME vadik ep02 "Боится лифтов с 2019-го"`, or `relationships`
  for a pair. The design sections above stay as written, so every addition shows when and
  where it came from, and `profiles.py unfact NAME ep02` takes an episode's facts back out.
  A fact the user states in chat gets the source `user`. Folding facts into the design is the
  user's call.
- `profile.md`: every preference the user stated while writing or listening ("too many
  scenes", "casual spoken language"), in their words. The profile is where preferences live.

## Fix mode

For an existing script: mark its beats and callbacks (B8, J2), run the lint, run the doctor
(step 9), then apply and re-lint. Keep what works; the user's lines are the user's.
