# Modes

A **mode** is craft for one kind of writing in one language: how to write good comedy in
Russian, good drama in English, and so on. It is not a world. A profile is a world (a series,
its characters, its taste); a mode is the know-how that any world in that language and genre
uses.

```
skill (SKILL.md)         craft true for any story
  mode (modes/NAME.md)   craft for one language and genre
    profile              one world: its cast, setting, taste
```

## Precedence

Profile beats mode, mode beats the skill's defaults. A rule in a mode says what is true for
that language and genre; a profile may override it for its world and says so in `profile.md`.
Where a mode and SKILL.md agree, SKILL.md's number is cited.

## How a world picks its mode

`profile.md` has a `**Mode**:` line with one or two mode names (for example `NAME` or `NAME +
OTHER`). Read `${CLAUDE_SKILL_DIR}/modes/NAME/mode.md` for every named mode before the premise (step 0).
A profile with no Mode line: ask the user what language and genre it is, pick the mode that
fits, write the line into `profile.md`. If no mode fits, write the world without one, and offer
to start a mode afterwards from what the user corrected (see "Starting a mode").

New worlds pick a mode on day one. "A comedy about wizards, in Russian" means: new profile
`wizards`, `**Mode**:` the one that matches the language and genre; the world's own entities
and taste go in the profile, the craft comes from the mode.

## Finding modes

`uv run $S/profiles.py modes` lists every folder under `modes/` that has a `mode.md`, with the
`description` from its front matter. Nothing else names them: add a folder and it is found.

Each mode is a folder:

```
modes/NAME/
  mode.md       front matter (name, description), then the rules, numbered, cited in
                reviews; the process and the checks
  evidence.md   what was measured and which lines failed or worked, with the author's ratings
  example.md    a worked sketch from bible to approved script
```

## Starting a mode

A mode is written from a user's corrections, not guessed. Keep it small and numbered:

1. **Scope**: language, genre, form (sketch, episode), what it does not cover.
2. **Rules**, each with a short id (`SR3`), one line of what to do, and the failure it
   prevents. Cite them in reviews.
3. **Process**: the route for this genre through the skill's steps.
4. **Checks**: what the fresh-reader checks look for here, and what does not work.
5. **Evidence** and an **example**: separate files in the same folder. Rules are cut from the
   evidence when it stops being true.

Add a mode only after the user has rated real output: a rule with no rated failure behind it is
a guess and stays out.
