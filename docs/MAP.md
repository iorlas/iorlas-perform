# Map: where everything lives (2026-11-05)

Written by the skills-absorb session. State read from git, not from memory; re-check with `git worktree list` before acting.

## Repos and worktrees
| place | holds | state |
|---|---|---|
| `/Users/iorlas/Workspaces/iorlas-perform` (main) | plugin: skills perform, voice, scenario; scripts (audio + video planning), `video/engine`, `video/rigs`, `video/art`, tests, voices | **canonical**. `origin/main` = `b4d09a8` "0.6.0: video engine, frozen rigs, whisper leveling", tag `v0.6.0` |
| `-rig-freeze` (branch `rig-freeze`) | the rig library's history | merged into main (`4d521bd`); pushed as `origin/rig-freeze`. Delete when no longer needed |
| `-video-spike` (branch `spike/video-engine`) | the engine's history (38 commits) | merged into main (`d05d2a2`); pushed as `origin/spike/video-engine`. The engine session may still work there: do not edit its files |
| `.claude/worktrees/upbeat-jang-cb2a7a` | this branch `claude/skills-absorb-8bdeb8` (skills, release tooling, MAP) | not pushed, not merged |
| `.claude/worktrees/episode-spec-eebd80` | another session (episode spec) | do not touch |
| `/Users/iorlas/Workspaces/ru-voice-clone` | art, scenarios, research, 2026-10 prototypes | **now a local git repo** (backup only, no remote); see below |
| profile dir `~/.claude/plugins/data/iorlas-perform-iorlas-marketplace/profiles/<world>/` | world docs, voices, episodes, renders | user data, **no git, no backup**: `git init` it (world-bootstrap checklist) |
| plugin cache `~/.claude/plugins/cache/iorlas-marketplace/iorlas-perform/` | 0.1.0-0.4.0 | **installed is still 0.4.0** (no scenario, no video skills): run the refresh in `docs/RELEASING.md` |
| `~/Library/Application Support/Claude/side-session-notes/...` | spike report, voice science, RCA, set tooling `*.mjs` | session notes; the `*.mjs` set/shot tooling and notes are now also in `ru-voice-clone/tools` and `research/` (backup repo) |

## ru-voice-clone contents
`art/` (sets A-F, cards, brand kit, stress frames; 12 MB), `scenarios/pravila/` (script v1-v3, design sheet, set census; renders are 55 MB and ignored), `research/` (audit, Shorts hooks, Kylo digest, video-workflows landscape, scenario research), plus the old prototypes (`clone.py`, `speak*.py`, `drama3*`, `queue*.sh`) that duplicate `iorlas-perform/scripts`, and big outputs (`stories/` 222 MB, `scenes/` 48 MB, `out.wav`) that are ignored. `research/_inbox/` holds another creator's zip: not committed.

## Merge plan: status
| step | status |
|---|---|
| commit the whisper leveling (`level_hushed`) | **done** on main (`a096b2c`); test added in this branch (`tests/test_scene_level.py`) |
| merge `rig-freeze` into main | **done** (`4d521bd`) |
| merge `spike/video-engine` | **done** (`d05d2a2`); rig dirs byte-identical; `skills/scenario/modes/` kept |
| tests, one golden render, tag | `v0.6.0` tagged and pushed; 67 tests pass in this branch (`pytest tests`), the slow audio-identical test and the render test are skipped without the models/Chrome |
| refresh the plugin cache | **open**: installed is 0.4.0 |
| merge this branch (`skills-absorb`) | **open**, Denis decides; then `uv run dev/release.py "skills: video, video-art, shorts, world-bootstrap" --minor --execute` (0.7.0) |
| delete merged branches/worktrees | open: `rig-freeze`, `spike/video-engine` (after the engine session is done), the scratch `claude/upbeat-jang-cb2a7a` |

**Rebase risks that remain.** The scenario SKILL.md in this branch is trimmed (steps 1-9 moved verbatim to `design.md`, `writing.md`, `checks.md`; `structure-research.md` moved to `docs/research/scenario-structure.md`). Any other branch that edits those sections of SKILL.md (the modes and episode-spec sessions) will conflict: move its hunk to the sub-doc with the same `##` heading. Rigs: `9241fdf` dropped an unreleased `mama 1.0.1`; a branch based before that must not bring it back.

## Moved from scenario/SKILL.md (verbatim, ids unchanged)
| sections | now in |
|---|---|
| 1 Premise, 2 Cast, 3 Beat sheet, 4 Joke map, 4a Story map, 5 Outline check, 6 Scene plan | `skills/scenario/design.md` |
| 7 Turns, 7b Punch-up, 7c Short scenes | `skills/scenario/writing.md` |
| 8 Lint, 8a Listener check, 8b Line check, **8c Table read (new)**, 9 Doctor | `skills/scenario/checks.md` |
| SKILL.md keeps | profile/mode (0), approve (10), canon (11), fix mode, headings with pointers |

Evidence behind the skills is copied into this repo: `docs/research/` (audit, Shorts hooks, Kylo digest, video-workflows landscape, scenario structure). `uv.lock` is ignored: the scripts are PEP 723 and the file was a churning stub.

## Open items (not coded; specified in the skills)
- De-hardcode (audit item 7): per-world `layout.json`, `--world`, rig capability flags, format profiles. Spec: `skills/video/pipeline.md`, `contracts.md`.
- Shorts route (item 8): 9:16 profile, portrait cameras, subtitles component, hook and length gates. Spec: `skills/shorts/spec.md`.
- Word-level timeline v3 (forced alignment test plan in `research/claude_video_workflows.md`).
- ~100 ruff findings in the video scripts that landed with 0.6.0 (`uvx ruff check scripts`): the release gate is off by default for that reason.
- Back up the profile dir and add a remote for ru-voice-clone or move art/scenarios into the world profile (audit §4 target structure).
