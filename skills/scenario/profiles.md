# Profiles

A profile is one series or world: everything the writer and the renderer need to make its
next episode. The skill holds craft that is true for any story; the profile holds one world's
taste. When they conflict, the profile wins.

## Where profiles live

Profiles are the user's own work. They never go into the plugin's repository or its install
folder (replaced on every update):

- `~/.claude/plugins/data/iorlas-perform-<marketplace>/profiles/`, the plugin's data folder
  (`${CLAUDE_PLUGIN_DATA}`), kept across updates; or
- `$PERFORM_PROFILES`, a folder the user chooses (a git repo of their own, a synced folder).

Uninstalling the plugin deletes its data folder unless the user passes `--keep-data`. Tell a
new user once: keep a backup, or set `$PERFORM_PROFILES`.

```
uv run $S/profiles.py              # where profiles live, and which exist
uv run $S/profiles.py NAME         # one profile's files and episodes
uv run $S/profiles.py new NAME     # a new profile from the template
```

## Layout

```
NAME/
  profile.md      format, length, language, tone and spice, intro, acting taste
  world.md        setting, entities, rules of the world, running gags, canon so far
  characters.md   cast table, character design, relationships, how each one sounds
  characters/     <voice>.md, one soul file per character: what makes them them
  structure.json  optional: the lint's structure rules for this genre
  levels.json     per-voice loudness and pitch (calibrate.py)
  voices/         <voice>.wav + <voice>.txt
  episodes/       NN-slug.md in order; 00-intro.md, if any, plays before each episode
  renders/        scene.py's output for this profile's episodes
```

## Filling a new profile

`profiles.py new` writes every section the skill reads, each with a one-line hint. Fill them
from what the user says, asking only about what changes the story: audience, tone, length,
narration, intro or not, how sharp. Then, in order:

1. **profile.md**: format and target length; the language register (how people here talk,
   which jargon and swearing belong); tone with one reference line for the sharpest moment;
   the running-gag cap; acting habits.
2. **world.md**: setting in concrete, audible details; then **entities**: every thing, place
   or institution that makes plots, as a row: what it is, its plot function, who it touches,
   and the rule that limits it. A rule is obeyed every time it comes up.
3. **characters.md**:
   - The cast table.
   - **Design**: for each character, what they want, their flaw, their comic lens (how they
     misread the world), what they do to the hero, and their status relative to the hero.
   - **Relationships**: the pairs that make the episodes. For each pair: what goes on, the
     recurring move, who starts high, what flips it.
   - How each one sounds: voice, tics, fillers.
   - **Soul files**, `characters/<voice>.md`, one per main character (template below).
4. **Voices**: one per character, `design_voice.py NAME "description" --line "..." --profile NAME`.
5. **Intro** (optional): `episodes/00-intro.md` with `<!-- lint: jingle -->`.
6. After the first render, calibrate levels (perform skill, step 5).

## Character soul files

The tables say what a character does; the soul file says who they are, so any writer
produces lines only they would say. `profiles.py new` writes `characters/hero.md` as the
template; copy it per character. Sections:

1. **Core**: who they are, what makes them them, in one paragraph.
2. **Charm**: why the listener loves them despite everything, concretely.
3. **Want, fear, wound.**
4. **Comic lens**: how they misread the world; their go-to move under pressure.
5. **Culture**: the real subcultures they come from (an imageboard generation, the army,
   a profession, a city, a decade), and what each gives them: words, reflexes, references;
   what they would never know or say. Real references only, never invented slang.
6. **Speech**: rhythm and pace (normal unless the character is defined by it), vocabulary,
   fillers, slang density, swearing; how they lie, panic, ask, brag, apologise; words they
   never use.
7. **Lines that are them** (about 8) and **lines that are not them** (about 5, with why).
8. **Voice direction**: delivery tags that fit and tags to avoid, for the TTS engine.
9. **With each main character**: how they talk to them, status, what they hide.

## structure.json

The lint's structure rules (`scenario.Rules`) have defaults for 3-6 minute comedy. A profile
for another genre overrides any subset:

```json
{
  "length": 8,
  "scenes_per_min": 0.5,
  "beats": ["cold-open", "setup", "incident", "ladder", "climax", "resolution"],
  "needed": ["cold-open", "incident", "climax"],
  "shares": {"cold-open": 0.1, "climax": 0.25, "resolution": 0.05},
  "min_rungs": 3,
  "callback_reach": 120,
  "callback_max": 3,
  "button_words": 8,
  "cast_max": 6
}
```

| field | default | what it controls |
|---|---|---|
| `length` | none | target minutes per episode; an episode's `<!-- length: N -->` wins |
| `beats` | hook, setup, incident, ladder, turn, button, tag | beat names, in order; `ladder` may repeat, the others appear once |
| `needed` | hook, incident, turn, button | beats every episode must have |
| `shares` | 6 / 11 / 5 / 46 / 17 / 7 / 7 % | runtime share per beat; reported past 2x or under half |
| `min_rungs` | 2 | ladder rungs at least |
| `scenes_per_min` | 0.7 | scene budget: more is reported |
| `callback_reach` | 90 s | longest gap from a plant or echo to its payoff |
| `callback_max` | 3 | touches per callback: plant, echo, payoff |
| `button_words` | 8 | the button's last line at most |
| `cast_max` | 6 | voices per episode |

A thriller might stretch the ladder and drop the button; a sketch show might need only hook,
turn and button. Change one number at a time and judge by ear.
