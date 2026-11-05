# scenario: check steps 8-9

Moved verbatim from SKILL.md. Steps 8 Lint, 8a Listener check, 8b Line check, 9 Doctor; 8c Table read is added here.

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

## 8b. Line check

The listener check asks where a fact is told; it passes a badly worded line if the scene's point
can be rebuilt from context. The line check reads every line alone. A fresh reader gets the
spoken lines (with tags) and, optionally, the characters' knowledge sheets, never the intents,
the map or the card, and for every numbered line says: what the speaker is doing with it,
whether it answers the line before, whether the speaker would know or ask it, whether a native
would say it that way, whether it is clear heard once.

```
uv run $S/listen.py lines <file>.md [sheets.md ...] [opus|codex]
uv run $S/listen.py lines-brief <file>.md [sheets.md ...] > brief.md   # for a fresh subagent
```

`sheets.md` are the soul-file sections for the characters (KNOWS, DOES NOT KNOW, questions).
Output: every line the reader flagged, and, for every line with an `intent`, the intent next to
what the reader heard, so a mismatch is visible. The findings are for the writer to judge, not
to apply: a third are wrong. Fix a real one by its missing link (L7), then run it again. It
checks sense and fit, not whether the scene is funny; only the user's rating tests that.

## 8c. Table read

The listener check finds facts nobody said; the line check judges lines alone. Neither asks
**would this person do this?** The table read does: one actor subagent per speaking role, each
reads the whole script as that character and objects aloud, in the first person, wherever
a line feels written rather than lived. Measured on a 5-scene comedy (2026-11-05): four actors found 7
real holes (a scene ending with no verdict, a skipped rule, a silent character who should
have reacted, an approval the character would never give, a quote that differed from its source,
a rule broken one line after being stated, a witness who hears a curse and says nothing) that lint, listener
check and the script's own author had passed.

Procedure:
1. Make `tableread.md`: the spoken lines with speaker names and tags. **No** intents, map,
   beat sheet, joke notes, cards or design marks: the actors must not know the jokes.
   Keep the narrator lines (marked as read by someone else).
2. One **Sonnet** subagent per speaking role (not the narrator), in parallel. Each is told
   only the file path ("read nothing else: no code, no other files") and its character in
   2-3 lines: age, job, what they want, what they fear. "You are not an editor, you are the
   actor who has to say these lines out loud."
3. Brief, per actor:
   - go scene by scene; for every line of YOUR character say it in your head: does a real
     person in this situation say it like that?
   - when a line is unmotivated, out of character, written not lived, or you would stumble
     on it, STOP and speak bluntly in the first person ("Нет, это бред, я бы так не сказал, потому что...");
   - react in character to the other characters' lines (they are your cue): do they make
     sense for them and the scene?
   - objections only, no praise; each: the line quoted, why it is wrong, what you would say
     instead (short);
   - **one special-attention clause per actor** for the scene's riskiest moment (a character
     who hears an insult aimed at them, a reaction the script may have skipped);
   - end with 3 answers: which moment made you laugh or feel something; what in the story's
     logic you do not believe; what you would say or do after the last line of the scene
     that worries you. Output: at most 12 numbered objections, each at most 3 lines.
4. Rank the pooled objections: **count of actors who raised the same hole** (3 of 4 beats 1 of 4),
   then severity (nothing happens after a punchline > a skipped step > wording).
5. Fold in: apply fixes that several actors independently proposed; a single actor's objection
   is applied only if it cites a rule or a character fact. **Refuse** a fix that makes a character
   do what they would not (an objection can be right about the hole and wrong about the cure:
   the actor's replacement line is a suggestion). Keep a "refused, with the reason" list.
6. After folding, re-run lint and the listener check, and add each real hole to `ledger.md`.
   A hole nothing but the table read caught is marked `catch: table read`.

Limits: actors do not talk to each other (no live exchange), they only react to written lines;
they flag motivation and logic, not rhythm or sound, which only an ear tests. Cost: one cheap
subagent per role, a few minutes. Skip for a 2-character sketch under a minute (the line check is enough).

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
