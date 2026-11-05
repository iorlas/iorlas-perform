---
name: scenario
description: Design and write, or fix, a script for an audio story, radio play or narrated multi-voice episode, inside a profile (a series folder with its world, entities, characters, relationships, voices, taste and past episodes) and a mode (the craft of one language and genre that any world uses; found with `profiles.py modes`). Works structure first: premise and game, beat sheet, joke map, scene plan, then turns, so a listener with closed eyes always knows who speaks, where and when, and every beat causes the next. Output is a lint-clean Markdown scenario (.md) ready for /perform. Use for "write a scenario", "pilot", "next episode", "script this story", "fix this script", or as step 1 of /perform. A brand-new world or series starts in the `world-bootstrap` skill, which comes back here for step 0. For rendering, use perform; for a single voice reading text, use voice.
---

# scenario

Design an episode the way a writers' room does, then write it, check it, and record it.

```
0 Profile -> 1 Premise -> 2 Cast -> 3 Beat sheet -> 4 Joke map -> 4a Story map -> 5 Outline check
  -> 6 Scene plan -> 7 Turns -> 7b Punch-up -> 8 Lint -> 8a Listener check -> 8c Table read -> 9 Doctor -> 10 Approve -> 11 Canon
```

Scripts: `${CLAUDE_SKILL_DIR}/../../scripts`, called `$S` below.

| file | holds |
|---|---|
| this file | the process and the profile and mode rules (P1...); the rest of the numbered rules (B3, T11, ...) sit in the three step files below, ids unchanged so a review can cite them |
| `${CLAUDE_SKILL_DIR}/format.md` | the file syntax: cast, scenes, turns, ambience, effects, design marks |
| `${CLAUDE_SKILL_DIR}/ledger.md` | every line a listener stumbled on, its cause and the rule it produced: read before writing; add each new one |
| `${CLAUDE_SKILL_DIR}/profiles.md` | where profiles live, their layout, filling a new one, `structure.json` |
| `${CLAUDE_SKILL_DIR}/design.md` | steps 1-6: premise, cast, beat sheet, joke map, story map, outline check, scene plan |
| `${CLAUDE_SKILL_DIR}/writing.md` | steps 7-7c: turns, punch-up, short scenes |
| `${CLAUDE_SKILL_DIR}/checks.md` | steps 8-9: lint, listener check, line check, table read, doctor |
| `${CLAUDE_SKILL_DIR}/craft.md` | the sources behind the rules (the long research is `docs/research/scenario-structure.md` in the repo, not loaded) |
| `${CLAUDE_SKILL_DIR}/modes.md`, `modes/NAME/mode.md` | modes: craft for one language and genre, layered between this file and a profile (list below) |
| the `voice` skill | delivery tags and what the TTS engine does with them |

## Modes

A mode is the craft of one language and genre. `uv run $S/profiles.py modes` lists every mode
installed, with a one-line description and the path of its `mode.md`; a new mode shows up there
without being registered anywhere. Read the mode your profile names (`**Mode**:` in
`profile.md`) before writing. Its rules are cited by id alongside this file's. How modes work,
precedence, how to start one: `${CLAUDE_SKILL_DIR}/modes.md`.

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
- P5. **Mode.** `profile.md` names its mode (`**Mode**: NAME`); `profiles.py modes` lists what is installed;
  read each named mode's `modes/NAME/mode.md` now (`modes.md`). Precedence: profile, then mode, then this file's defaults. A
  profile with no Mode line gets one: ask the user for language and genre, and write it. A
  new world in a known language and genre starts from the mode, not from nothing.
- P6. **Short scenes** (a sketch under about a minute, or one scene of an episode) take the
  route in 7c: card, intents, line check. The beat sheet and joke density below are for episodes.

## 1. Premise
Rules and procedure: `${CLAUDE_SKILL_DIR}/design.md` under this heading.

## 2. Cast
Rules and procedure: `${CLAUDE_SKILL_DIR}/design.md` under this heading.

## 3. Beat sheet
Rules and procedure: `${CLAUDE_SKILL_DIR}/design.md` under this heading.

## 4. Joke map
Rules and procedure: `${CLAUDE_SKILL_DIR}/design.md` under this heading.

## 4a. Story map
Rules and procedure: `${CLAUDE_SKILL_DIR}/design.md` under this heading.

## 5. Outline check
Rules and procedure: `${CLAUDE_SKILL_DIR}/design.md` under this heading.

## 6. Scene plan
Rules and procedure: `${CLAUDE_SKILL_DIR}/design.md` under this heading.

## 7. Turns
Rules and procedure: `${CLAUDE_SKILL_DIR}/writing.md` under this heading.

## 7b. Punch-up
Rules and procedure: `${CLAUDE_SKILL_DIR}/writing.md` under this heading.

## 7c. Short scenes: card, intents, lines
Rules and procedure: `${CLAUDE_SKILL_DIR}/writing.md` under this heading.

## 8. Lint
Rules and procedure: `${CLAUDE_SKILL_DIR}/checks.md` under this heading.

## 8a. Listener check
Rules and procedure: `${CLAUDE_SKILL_DIR}/checks.md` under this heading.

## 8b. Line check
Rules and procedure: `${CLAUDE_SKILL_DIR}/checks.md` under this heading.

## 8c. Table read
Rules and procedure: `${CLAUDE_SKILL_DIR}/checks.md` under this heading. Actors as subagents, one per role, objecting aloud; run it on any script with 3+ characters before the doctor.

## 9. Doctor
Rules and procedure: `${CLAUDE_SKILL_DIR}/checks.md` under this heading.

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

For an existing script: mark its beats and callbacks (B8, J2), run the lint, run the line
check (8b) and the doctor (step 9), then apply and re-lint. Keep what works; the user's lines
are the user's. For a short scene, write the intents first (L4) and fix flagged lines by their
missing link (L7).
