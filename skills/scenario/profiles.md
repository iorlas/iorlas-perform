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
  characters.md   cast table, character design, how each one sounds
  relationships.md every pair that makes plots, characters and entities, with a map
  entities/       <id>.md, one soul file per character, object, place or institution
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
   - How each one sounds: voice, tics, fillers.
   - **relationships.md**: the pairs that make the episodes, character with character and
     character with entity. For each pair: what goes on, the recurring move, who starts
     high, what flips it.
   - **Soul files**, `entities/<id>.md`, one per character and per entity that is more than a
     name in the story (template below).
4. **Voices**: one per character, `design_voice.py NAME "description" --line "..." --profile NAME`.
5. **Intro** (optional): `episodes/00-intro.md` with `<!-- lint: jingle -->`.
6. After the first render, calibrate levels (perform skill, step 5).

## Entity soul files

The tables say what an entity does; the soul file says what it is, so any writer produces
lines and moments only it could make. A character is an entity with a voice; an object (a
server), a place (a factory) or an institution (a company) gets the same file, with how it
sounds in place of speech. `profiles.py new` writes `entities/hero.md` as the template.
Sections:

1. **Core**: what it is and what makes it it, in one paragraph.
2. **Charm**: why the listener loves it, concretely.
3. **Want, fear, wound** for a character; **plot function and rule** for a thing or place.
4. **Comic lens**: how it misreads the world, or what comedy it makes.
5. **Culture**: the real subcultures it comes from (an imageboard generation, the army, a
   trade, a city, a decade) and what each gives it; what it would never know or say.
6. **Milieu**: what surrounds such a person or thing in real life: the type, their objects,
   places, rituals, sayings, smells and sounds; what makes them work and what breaks them.
7. **Speech** (or how it sounds): rhythm and pace (normal unless defined by it), vocabulary,
   fillers, slang; the explicit-language rule (which words, how often, with whom never); how
   it lies, panics, asks, brags; words it never uses.
8. **Lines that are it** (about 10) and **lines that are not it** (about 5, with why).
9. **Voice direction**: delivery tags that fit and to avoid; for a thing, its beds and effects.
10. **Connections**: to each main character and entity: status, what it hides, what it wants.

Real references only, never invented slang; mark anything invented as such.

## Facts

What episodes and conversations add to an entity or a pair after the design goes under
`## Facts` at the end of its file, one dated line with its source, oldest first:

```
- 2026-11-02 · ep02 · Боится лифтов с 2019-го: застрял с Палычем на 40 минут.
```

```
uv run $S/profiles.py fact NAME ID SRC "text"   # ID is an entity file, or relationships
uv run $S/profiles.py facts NAME [SRC]          # list, all or one source
uv run $S/profiles.py unfact NAME SRC           # remove a source's facts: undo an episode
```

Sources: `epNN` for an episode, `user` for what the user said in chat, `design` for a
writer's later addition. The design sections are never edited to add a fact, so the file
always shows what was designed and what came later; folding a fact in is the user's call.

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
