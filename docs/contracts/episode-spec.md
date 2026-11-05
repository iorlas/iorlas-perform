# episode.spec

The plan an episode is written from, made before the script. `scripts/episode.py`:

```
episode.py new WORLD SLUG [--format ID] [--template ID] [--target S] [--number N]
episode.py expand SPEC [--script] [--write]
episode.py check SPEC [SCRIPT] [--timeline FILE] [--audio WAV] [--strict]
episode.py distinct SPEC
```

## Fields

| field | meaning |
|---|---|
| `schema`, `number`, `slug`, `status` | `episode.spec/1`; order in the ledger; `draft`, `scripted`, `rendered`, `published`, `dropped` |
| `format` | a format id |
| `title` | `{working, pattern}`: pattern is a world-chosen id of the title's shape |
| `hook` | `{pattern, line, voice, on_screen, by_s}`: pattern is an id from `contracts/hooks.json`; line at most the format's `hook_max_words` (9 for Shorts: what fits a 3 s window at 3.2 words/s); `on_screen` at most 6 words; `by_s` not past the format's hook window |
| `premise` | `{text, key}`: key is a short id of the situation, compared across episodes |
| `mechanism` | id of the central joke mechanism, world-chosen |
| `outcome` | `{type, note}`: twist or outcome type, world-chosen id |
| `set` | id of the main set |
| `cast` | list of voices |
| `structure` | `{template, target_s, tolerance_s, beats[]}`; a beat is `{id, start_s, end_s, what, words?}` |
| `subtitles`, `cover` | `{style}`, `{style, text}`: plan, so experiments can vary them |
| `experiments` | experiment ids this episode tests or follows; unknown ids are an error |

Beat ids are the scenario lint's own names (`hook setup incident ladder turn button tag`), so a spec beat becomes
`<!-- beat: ID -->` unchanged. The beats must be contiguous from 0 s; a Shorts plan must end under 60 s.
The five **novelty keys** are `premise.key`, `mechanism`, `outcome.type`, `set`, `title.pattern`.

## Structure templates (`contracts/structures.json`), selectable per episode

| id | format | plan | beats (s) |
|---|---|---|---|
| `shorts-45-60-v1` | shorts | 52 s | hook 0-3, setup 3-7, incident 7-10, ladder 10-22, ladder 22-34, turn 34-46, button 46-52 |
| `shorts-reverse-open-v1` | shorts | 54 s | hook (aftermath) 0-4, setup 4-10, incident 10-14, ladder 14-26, ladder 26-38, turn 38-49, button 49-54 |
| `landscape-3min-v1` | 16:9 | 170 s | hook (cold open) 0-12, setup, incident, 3 ladders, turn, button, tag 165-170 |

A template also carries `rules`: scenario.Rules fields (laugh gap, cast size...) that `check` applies to the lint run.
`new --target S` scales the windows.

## expand

1. `expand SPEC`: writes each beat's word budget (window x the format's words/s band) into the spec and prints an outline.
   The human or the model fills each beat's `what`.
2. `expand SPEC --script --write`: writes `NN-slug.md` next to the spec (never overwrites): title, `length`, CARD comment,
   Cast table (described from the world's `characters.md` when present, else OPEN), an empty `## Map`, the set as the
   scene heading, then one `<!-- beat: ID -->` plus a spec comment (window, words, role, `what`) per beat. No turn is invented.

## check

| check | level |
|---|---|
| spec fields valid; OPEN fields listed | error / open |
| distinct vs earlier episodes | see [distinctness.md](distinctness.md) |
| script beats equal the spec's beats, in order | error |
| spec cast in the script's Cast table; hook line present in the hook beat | error / warn |
| the existing lint (`scenario.lint`) under the template's rules | its own level |
| with a timeline: each beat starts within `tolerance_s` of its plan | error |
| the hook turn ends by `hook.by_s`; first voice by the format's `hook_voice_by_s` | error / warn |
| total length from `--audio` (WAV), else the timeline's `duration`, else its last end: Shorts must be **under** 60 s | error |
| length outside the format's target range; words per second outside the band | warn |
| no timeline: timing estimated from characters (11 chars/s), warnings only | warn |
| timeline from another script version (turn count or text differs) | error |

Timeline = `scene.py`'s `*.timeline.json` (a list) or a `timeline/2` object.

## Example

Fixture `tests/fixtures/worlds/vadik/episodes/01-deploy.spec.json` (beats shortened here):

```json
{
  "schema": "episode.spec/1", "number": 1, "slug": "deploy", "status": "scripted",
  "format": "shorts-9x16-60s",
  "title": {"working": "Удалил продакшен", "pattern": "rule-number"},
  "hook": {"pattern": "standalone-line", "line": "Я удалил продакшен.", "voice": "vadik", "on_screen": "Удалил продакшен", "by_s": 3},
  "premise": {"text": "Вадик удалил продакшен и называет это тихим режимом", "key": "deleted-prod"},
  "mechanism": "literal-obedience",
  "outcome": {"type": "boss-believes-it", "note": "fixture"},
  "set": "office",
  "cast": ["vadik", "palych"],
  "structure": {"template": "shorts-45-60-v1", "target_s": 52, "tolerance_s": 4, "beats": [
    {"id": "hook", "start_s": 0, "end_s": 3, "what": "the strongest standalone line or odd image"},
    {"id": "setup", "start_s": 3, "end_s": 7, "what": "who, where, what is wrong"}
  ]},
  "subtitles": {"style": "karaoke-2x3"},
  "cover": {"style": "hero-left", "text": "Удалил продакшен"},
  "experiments": ["subs-karaoke-colour"]
}
```
