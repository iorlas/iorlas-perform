# world-bootstrap: new-world checklist

A world supplies eight things. Each has a **done-test**; do not move on without it. "Today" = what the first world had.

| # | item | where it lives | done-test | skill that does it |
|---|---|---|---|---|
| 1 | **World docs**: `profile.md` (format, length, language, mode, tone, intro, acting taste), `world.md`, `characters.md`, `relationships.md`, `taste-log.md`, `arcs.md` | profile dir | scenario step 0 reads them with no template hints left; the mode is named (`profiles.py modes`) | scenario (0, profiles.md) |
| 2 | **Voices** per speaking character, `levels.json`, casting lint passes (no two voices too close) | `voices/` | `design_voice.py` lint clean; each voice rated by ear; a one-line extra has its own voice too | voice, perform |
| 3 | **Rigs** (frozen, locked, golden PNG) for every cast member and prop-character | `video/rigs/<id>/<semver>/` (shared library) + `video/rigs.json` listing the world's `id@semver` | `verify.py` green; golden reviewed one image at a time; rig-gap list filled for the planned scenarios | video-art `rigs.md` |
| 4 | **Set census** per scenario: places, tier, time of day, recurrence; anchors first | `scenarios/<slug>/census.md` | every place has a tier and a status; anchors teach the kit a new dimension | video-art `census.md` |
| 5 | **Style grammar and palette**: one doc; AR1-AR7 reused unless a rule is changed on purpose | `video/style.md` (or reference the shared grammar) | the first set passes the short list in video-art | video-art |
| 6 | **Layout and format**: cast map (voice -> rig), cameras by cast set, looks, background, props, `format` (`landscape-720`, `shorts-1080x1920`) | `video/layout.json` in the profile (spec: engine takes `--world`; today one global file) | a one-scene render uses the world's layout, no name check in code | video |
| 7 | **Intro / end cards, sting, corner mark, brand line** | `video/brand/` | Shorts: no intro card, sting <= 0.5 s, mark 1 s; 16:9: card <= 3 s after the cold open | shorts `packaging.md` |
| 8 | **Series bible**: running gags, callbacks, open guns | `arcs.md`, `ledger` of failures | one episode canon update done (scenario 11) | scenario |

## Profile layout (adds `video/` to the audio profile)
```
<world>/
  profile.md world.md characters.md relationships.md taste-log.md arcs.md structure.json levels.json
  entities/  voices/  episodes/  renders/
  video/
    layout.json     cast map, cameras, looks, background, format
    rigs.json       which id@semver this world uses
    style.md        palette, grammar changes
    sets/           set art ids (art/<id>.json + svg per variant)
    brand/          cards, sting, corner mark
  scenarios/<slug>/ <slug>.md  <slug>.design.md  <slug>.census.md  <slug>.design.json  render/
```
Init the world dir as a git repo; `.gitignore`: `renders/`, `render/`, `*.wav`, `.DS_Store`.

## Order that avoids rework
1. World docs and 3 characters with voices (audio can ship alone).
2. One pilot scenario, audio only; table read; listen.
3. Looks for the 2-3 main characters, **one image at a time**; freeze after each acceptance.
4. Census of the pilot; build the anchors; one scene end to end (render, QA) before the rest.
5. Only then a second scenario, and the idea matrix for choosing it.

## What not to do
- Do not start from the first world's files: copy the *structure*, not the content.
- Do not draw sets before a design sheet; do not freeze a rig before its pose list is checked.
- Do not hard-code a name in repo code; if a script needs a world fact, it reads it from the profile.
- Do not make the world's art "extreme" first: explore 12 looks, pick numbers, then calm the lines.
