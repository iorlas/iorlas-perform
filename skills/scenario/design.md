# scenario: design steps 1-6

Moved verbatim from SKILL.md. Steps 1 Premise to 6 Scene plan; rule ids (P, R, C, B, J, M) are unchanged and still cited from SKILL.md.

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
- C6. **One voice, one person, for the whole series.** Every speaking role gets its own voice,
  a one-line extra too: the anon who answers on Двач, a courier, a voice on the radio. A voice
  in `characters.md` belongs to its character; it is never lent to another role, even for one
  line, because the ear has already tied it to a face and hears that person speak. An extra
  gets a new voice and a row in `characters.md`, even if marked `(extra, ep NN)`. Two voices
  that score close are mixed up by the ear: Михалыч and Палыч scored 0.44 and were.
  - Make or change a voice with `design_voice.py NAME "..." --profile PROFILE`: it designs
    `--tries` takes, scores each against the cast and saves the most distinct, or saves nothing
    and says which voice each take sounds like, the pitch gap, and where pitch room is free.
    A refusal is acted on, never forced past: change an axis the ear hears (age, pitch, pace,
    accent, energy, C5), or reshape with `--pitch HZ --formant RATIO` (0.88 makes a voice
    bigger and older). Richer words alone often land on the same timbre. Or start from a
    consented reference voice, seeded in Russian (the `voice` skill, Voices).
  - Then `uv run $S/voice_similarity.py PROFILE` refreshes `voices/similarity.json`. The lint
    warns when a cast voice belongs to another character, when two cast voices are the same
    file, and when a cast pair scores over `voice_sim_max` (*tunable*) unless their median
    pitches are `voice_pitch_apart` (6, *tunable*) semitones or more apart: Михалыч and Палыч
    scored 0.46 at 7.6 semitones and were told apart. A close pair is redesigned apart, not
    kept apart by naming.

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
