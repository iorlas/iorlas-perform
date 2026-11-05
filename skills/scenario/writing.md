# scenario: writing steps 7-7c

Moved verbatim from SKILL.md. Steps 7 Turns, 7b Punch-up, 7c Short scenes; rule ids (T, L) are unchanged.

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

## 7c. Short scenes: card, intents, lines

A scene of a few lines lives or dies on whether each line makes sense, comes from that person,
and is heard right. Written first as a card, so a line has a reason before it has words.

- L1. **Card.** Before any line: place and time; what each person wants from the other; what
  each knows at the start; the order in which the facts come out; who owns the turn. A line
  the user already liked is copied into the card verbatim and is not rewritten (a missing
  link is added, the punch stays).
- L2. **Knowledge map.** Each character's soul file lists what they KNOW, what they DO NOT know,
  and the questions they would really ask (a closed list). A line outside the map is cut. A
  fact reaches a character only by what someone says to them.
- L3. **Reactive.** Every line answers or reacts to the one before. One new fact per turn; bad
  news comes out in pieces, pulled by the other person's questions. Nobody speaks to inform the
  audience.
- L4. **Intent.** Every line gets one comment before it: `<!-- intent: what the speaker does with
  this line and why now -->`. The lint ignores it; the line check (8b) reads the line without
  it and compares.
- L5. **Concept before words.** Say the bit in one plain sentence. If it is not funny, true to
  the world and clear without jargon, change the idea; polishing wording cannot rescue it.
- L6. **The turn closes the scene** (the last one or two lines), in plain words, understood
  once. The reaction to a crisis goes to its biggest consequence before any joke on it. Nothing
  follows the funny word.
- L7. **Fix by the link.** A flagged line is repaired at the thing it lacks (a missing word, a
  motive, a fact told earlier), not rewritten. Lines the user rated well are left alone.
- L8. **Emotion.** At most one spike per scene, aimed at the situation. A change of delivery at
  the pivot is a change of tag in the line, so the actor gets the cue (T14).

Route: card (L1) → concept test (L5) → draft with intents (L2-L4; English is allowed here: it
holds meaning, not wording) → rewrite into the profile's register, line for line (T3) → lint →
line check (8b) → fix (L7) → closer (L6) → show the user. The lint is built for episodes and
warns on a sketch about missing beats, laugh marks and a map; those are expected, and kept with
`<!-- lint-ok: ... -->` and the reason, or ignored for a scene under a minute. The language's mode adds its own rules
and checks (`profiles.py modes` lists the modes).
