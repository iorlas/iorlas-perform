---
name: ru-comedy
description: Comedy in Russian that is heard once (sketch, scene, episode): spoken Russian first, concept before wording, punchline structure, who-knows-what, line check
---

# Mode: ru-comedy

Comedy in Russian, written to be spoken and heard once: a sketch, a scene or an episode, for a
voice cast or actors. It applies to any world whose profile names it (`**Mode**: ru-comedy`).
Numbers (SR3, PN2) are cited in reviews. The evidence for each rule, with the ratings it came
from, is in `evidence.md`.

## What this mode is for

A listener hears each line once. The scene is a score for actors, not a joke to be printed:
voice, pause and the other person's reaction do part of the laugh, and the text must hand them
a clear situation and a beat to play. Most of the failures behind these rules were not
unfunny jokes but lines that made no sense, were not said by that person, or could not be
heard: fixing sense comes first, funny second.

## SR. Spoken Russian first

- SR1. **The ear test.** Every line must pass: could a real person say this on the phone at
  night, without sounding like a document? If it sounds written, rewrite it. This outranks
  elegance, compactness and every rule below.
- SR2. **Use** what speech uses: elliptical repetition («За каждый — штраф», not «За каждый час
  штраф»), particles and fillers (ну, же, ведь, то есть, значит), short answers that echo the
  question, office-colloquial vocabulary, sparing contractions.
- SR3. **Avoid** bureaucratic and translated phrasing («допустимо», «сверх нормы», «осуществить»,
  «в рамках»), long subordinate clauses, participle and gerund chains, a noun where speech
  uses a verb, English word order.
- SR4. **Punctuation is acting.** A dash or `...` marks the pause an actor needs. «За каждый
  штраф» is read as "for each fine"; «За каждый — штраф» is heard as "for each one, a fine".
- SR5. **Say what people say.** Industry words as people say them (прод, бэкап, сервер, база,
  алерт, деплой, релиз, тикет) stay, never swapped for a Russian word (T3). A name that cannot be
  read aloud («tmp», «тмп») is replaced by what people say: «временная папка».
- SR6. **No compression into riddle.** The shorter the line, the more of its meaning the
  listener must supply; they supply a different one. Heard once, «Пока вы звоните» means
  "while you keep calling", not "while you hold me on the line"; «пока мы разговариваем» says
  what was meant. Say the link (T11). Write the full line first, then cut while a fresh reader
  still recovers the same meaning (PR).
- SR7. **No explaining either.** A line that explains the joke, or a character who delivers the
  setup as a speech, fails as surely as a riddle. Setup lines are short spoken turns; the facts
  arrive one per turn, pulled out by the other person's questions (KN3).

## CC. Concept before wording

- CC1. **Concept test.** Tell the bit in one plain sentence to someone who works in the
  setting. It must be (a) true or plausible in that world, (b) a stinger: someone loses status,
  money or face, (c) understood without the setting's jargon in one beat. A bit that fails the
  test is replaced, not polished. A penalty bigger than the whole company, "clients take the
  night shifts" and a pile of invented hyperbole failed this; a recovery drill that only ever
  happened on paper passed.
- CC2. **Real truth beats invented absurdity.** A true, recognisable situation played straight
  gets the wince and the laugh; an odd event with no motive is called "bizarre". Draw bits from
  what the audience has lived (backups on the same disk, a wiki that holds its own password,
  alerts sent by the mail server that is down, the one person who knew how it works left).
- CC3. **The bit is not a gag collection.** One game per scene. Five unrelated gags are a
  list (J8, R2).
- CC4. **Judge a bit before you write it, and before you rewrite it.** If a fixed scene is still
  unfunny, suspect the concept, not the wording.

## TY. Turn types that landed

A turn is the surprising reading of the situation that closes the scene. These worked; reach for
one before inventing another.

| type | mechanism | line (rated) |
|---|---|---|
| **Literalise** | A sarcastic layman takes the expert's own logic literally and draws the absurd conclusion | «У меня на ноутбуке всё работает. — Тогда отправим клиентам твой ноутбук.» |
| **Rule loop** | A rule the speaker wrote or enforces traps its author | «Регламент предусматривает, что вы уволите меня.» |
| **Self-reference loop** | Each thing needs the thing that is down | the password is in the wiki, the wiki is on the server |
| **Flip the spin** | After a total loss, the boss files the loss as a feature | «Данных нет. Бэкапа нет. Зато безопасность у нас идеальная: взламывать нечего.» |
| **The cause is in the room** | The unexplained thing is the person on the phone | «Кто их ведёт? — Я. Прямо сейчас. С вами по телефону.» |
| **Deflation by a checkable fact** | A big claim, then the specific number or name that deflates it | «Он один и жив.» |

## PN. Punchline structure

- PN1. **Reinterpret.** The setup builds an assumption; the punch gives the same facts another
  reading. A line that only states how bad it is, or sums up, is not a punch.
- PN2. **The strike word is last.** Nothing follows it: no tag, no moral, no second explanation.
- PN3. **Shorter than the setup.** The punch is a few words; the setup may be whole sentences (T12).
- PN4. **Inevitable in hindsight.** The audience can see afterwards that the answer was already
  in the setup. If a punch needs a fact the scene did not say, add the line that says it (T11).
- PN5. **A tag is a topper.** A second turn on the same idea that is more extreme than the first,
  never a summary or verdict. A verdict is a rimshot.
- PN6. **Consequence first.** The reaction to a crisis addresses its biggest consequence in the
  scene before any joke on it. If the data is gone, the boss reacts to the loss, then the joke
  spins the loss («То есть бэкапа нет.» / «Нет.» / then the spin). A joke that ignores the
  consequence reads as the writer not noticing.
- PN7. **Sarcasm derives from a stated fact.** A sarcastic closer takes something just said
  and bends it; sarcasm with no fact behind it is "silly". Say it as sarcasm: tag and wording.
- PN8. **Stand-up closer.** A closer in the voice of a stand-up: flat facts, a short pause, then
  the spin with false enthusiasm. The change of tag is the actor's cue:
  `[холодно, ровно] Данных нет. Бэкапа нет. (пауза) [саркастично, с наигранным воодушевлением] Зато…`
  Reaching for a general moral instead of the specific spin fails.

## KN. Who knows what, and why they speak

The pair that works: an authority who knows the vocabulary and not the insides, and an expert
under pressure who knows the insides and is afraid. The craft is in keeping their knowledge
apart.

- KN1. **Knowledge map.** Each character's soul file lists what they KNOW, what they DO NOT
  know, and the questions they would really ask (a closed list). The authority asks about blame,
  cost, duration and what to tell the owner or the clients; he does not ask "what still works?"
  or "which folder?" unless he is repeating a word he just heard.
- KN2. **Facts travel through answers.** What only the expert knows reaches the authority only
  by the expert's answer. The authority does not decode jargon he has no way to know.
- KN3. **Reactive.** Every line answers or reacts to the line before. One new fact per turn; bad
  news is released in pieces. A line spoken only to inform the audience is cut.
- KN4. **Motive for every line.** A character says it because of what he wants from the other
  person at this moment; he does not volunteer a fact nobody asked for unless that is the
  character (nervous spin), and then the line shows it.
- KN5. **Memory.** The authority does not forget what he was just told; the scene's logic does
  not run backwards. If he repeats something it is on purpose.
- KN6. **Roles.** Check who asks whom before the punch: a boss asking his engineer for the
  budget, or an engineer cross-examining the boss, kills the line.
- KN7. **The expert does not explain.** He answers the question asked, in 3 to 12 words, and
  stops. He is frightened, polite and technically accurate; not cheeky, not stupid, not
  confessing unprompted.
- KN8. **The authority never admits fault.** When shown he caused the trouble, he reddens and
  snaps at the messenger («Тогда зачем ты со мной разговариваешь?!»). Stubbornness and
  demanding the impossible read as funny; cruelty to the expert as a person does not.

## EM. Emotion

- EM1. **One spike per scene,** aimed at the situation, never at the other person as a person.
  Shouting throughout reads as "aggressive, no humour".
- EM2. **Spike, then flat.** The contrast is the laugh: a scream and a breath, then the flat
  line; a nervous laugh that cuts off; a whisper.
- EM3. **A tonal switch needs a reason in the scene** (C3c).
- EM4. **Explicit language** follows the character's soul file (C3b): finesse and function, not
  a stream, except a real peak. Default for a new world in this mode: none.
- EM5. **Dark but not cruel.** Stakes (firing, lawsuit, lost data, a mortgage) are the dark; the
  cruelty is not. A boss who crushes the expert is "too harsh".

## PR. Process for a short scene (under about a minute)

Under a minute, the episode machinery (beats, scene budget, joke density) shrinks to a card
and a few lines. SKILL.md 7c holds the generic route; for this mode:

1. **Bible, once per world:** world facts (company, team, what runs where), a sheet per
   character (background, wants, fears, KNOWS, DOES NOT KNOW, the questions he would really
   ask, voice samples). A thin or contradictory character sheet makes the authority an
   exposition device and the expert an explainer.
2. **Card per scene:** place and time, each person's want, what each knows at the start, the
   order in which the facts come out, who owns the turn. If a line is fixed (the user liked
   it), it is copied verbatim.
3. **Concept test (CC1)** on the card. Replace a weak concept now.
4. **Plain draft with intent:** every line followed by `<!-- intent: ... -->` (what the speaker
   does with it and why now; SKILL.md L4). English is allowed for this step: it holds meaning,
   not wording. In a test of eight premises the English-first pipeline did slightly better
   than writing in Russian directly (4 of 8 against 2 of 8 rated ok or better; weak evidence).
5. **Spoken Russian (SR):** a rewrite into speech, not a translation; the same lines and the
   same intents, line for line.
6. **Line check (SKILL.md 8b):** a fresh reader with only the spoken lines and the character
   sheets. Fix flagged lines by their missing link.
7. **Closer (PN):** write the last beat as a stand-up would, with the tag pivot.
8. **Compress only if needed,** one cut at a time, re-running the check; stop when the reader
   stops recovering the meaning. Compression was the most common cause of "I don't get it".
9. **Show the user,** numbered, as a list (one line per bullet) so the lines do not run into one
   paragraph; ask for a rating of each. See TS.

## CK. Checks that work, and those that do not

- CK1. **Line-by-line blind check (8b)** works: a fresh agent given only the spoken lines and
  the character sheets says per line what it does, whether it follows the line before, whether
  the speaker would know it, whether it is natural, whether it is clear. It flagged a garbled
  phrase, an unspeakable name, two knowledge violations and a broken chain in one pass.
- CK2. **Scene-level readers do not.** A reader who recovers the scene's point from context
  passes a badly worded line. A scorer who holds the intended meaning is lenient.
- CK3. **Panels do not tell funny.** Persona judges and judges given comedians' names did not
  track the user's ratings (correlation about 0.07 on absolute scores; pairwise choices only
  separated clearly good from clearly bad). Panels also praised the lines the user called
  senseless. Do not use them as a gate for funniness.
- CK4. **A strict believability prompt flags everything,** good lines included. Use its flags
  as questions for the writer, never to reject.
- CK5. **Every flag is judged,** not applied: about a third are wrong. The writer fixes only
  the flagged line's missing link; the rest of the scene stays.
- CK6. **The user's rating is the only test of funny.** Show variants, ask for ratings, and
  record them (TS).

## TS. Calibrating with the user

- TS1. Show scenes as a shuffled, numbered list, one line per bullet. Ask for rating by number
  and a reason ("what do you not believe, what is missing").
- TS2. **Do not polish a line the user rated good.** Rewrites of good lines were rated lower
  each time. If the problem is a missing link, add the word that links.
- TS3. **Do not argue a rating** and do not defend the line; ask what would make it land.
- TS4. A fixed scene still rated "ok" is decided by the concept (CC1), then the closer (PN8),
  then the delivery tags (EM2), in that order.
- TS5. Record every rated line (all of them, good and bad) in the profile's taste log (see
  profiles.md "Calibrating taste"), with the user's words.
- TS6. What this author wants by default, from the ratings: dark and real, not cruel; stand-up
  style with a multi-step turn or post-irony, not shock; the expert frightened and plain, never
  silly; the authority a stubborn layman. A new author's mode starts from the same questions,
  not these answers.
