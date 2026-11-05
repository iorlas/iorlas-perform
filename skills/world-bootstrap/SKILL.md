---
name: world-bootstrap
description: Create a new world (a series with its own platform, audience, format, style, cast, voices, rigs and sets) the right way round, or bring an existing one up to standard. Runs a staged workflow with human stop points, from the world brief and style bible through the idea matrix and script for the medium to delivery; owns the per-episode distinctness gate against demonetisation. Use for "new world", "new series", "start another show", "bootstrap a channel", "what does a new world need", "pick the next episode idea", "is this episode too similar", "retro-fit this world". Writing the script is scenario, voices voice/perform, drawing video-art, rendering video, vertical packaging shorts, market research platform-research.
---

# world-bootstrap

A world is **made for a medium and an audience**, and that is decided first. The first world was built the other way round (voices, then script, then art) and every assumption about platform, audience, format and style surfaced late. This skill is the order that avoids that. Shape borrowed from an outside creator's two prompts: **bootstrap** installs a studio once per world, **episode** runs one episode, both with human stops.

Rules: worlds and scenarios are unconnected. Repo code and skills name no character, rig, set or voice; everything specific lives in the world's profile dir (per-world scripts may live there and call the universal ones). Test: delete a world, every script and skill still runs for another one.

## Stages (each has an output file, a stop point and an owner skill)

```
0 WORLD BRIEF     brief.md                        STOP A  platform, format, audience, genre, cadence, policy, success
1 STYLE BIBLE     video/style.md + video/brand/   STOP B  look, palettes, hero rules, subtitle + cover style (ONCE per world)
2 SERIES BIBLE    world/characters/voices/arcs    STOP C  cast, voices by ear, relationships, gags, ledger
3 IDEA MATRIX     ideas/<ep>.md                   STOP D  10 pairs scored -> top 3 -> pick; DISTINCTNESS CHECK
4 SCRIPT          episodes/NN.md                  STOP E  script for the medium; table read; distinctness re-check
5 VOICE           renders/NN.wav                  STOP F  audio approved by ear
6 DESIGN          NN.design.md + census + art     STOP G  sheet approved, then art one image at a time
7 ASSEMBLY        draft mp4 + contact sheet + QA  STOP H  accept or list defects (-> lessons ledger)
8 DELIVERY        cover, titles, notes.md, log    -       distinctness log entry, canon update
```
Stages 0-2 happen once per world; 3-8 once per episode. Never skip a stop to save time: a wrong premise costs a full render. Between stops everything is autonomous.

| file | holds |
|---|---|
| `stages.md` | per stage: inputs, what to produce, the questions, the stop, the owner skill, done-test |
| `brief-template.md` | the world brief: copy and fill (every field required; unknown = OPEN, never invented) |
| `distinctness.md` | the per-episode originality gate against the platform's repetitive-content policy |
| `idea-matrix.md` | the situation x place scorer |
| `checklist.md` | the eight things a world supplies, the profile layout with `video/`, order that avoids rework |
| `retrofit.md` | how to bring an existing world to this standard; which answers are missing |

## Start
1. `uv run ${CLAUDE_SKILL_DIR}/../../scripts/profiles.py new <name>` (profile template), then stage 0.
2. Before the brief: refresh the platform hypotheses (`platform-research` skill) so format and policy answers rest on current evidence.
3. Init the profile dir as a git repo; back it up.

## Tooling (another session builds it; check what exists before using it)
The `episode-spec` session is building machine-readable forms of these steps, documented in `docs/contracts/` on its branch (world.brief, episode.spec, distinctness, experiments, platform_rules; tools `world.py`, `episode.py`, `distinct.py`, `policy.py`, `experiments.py`). When they are on main: `world.py new/check` replaces the markdown brief (same fields; an undecided field holds the string `OPEN`), `distinct.py` is the deterministic form of `distinctness.md` (it compares keys, a reviewer still reads them), `policy.py check` runs before publishing. Until then use the markdown templates here. A rule to keep either way: **OPEN is never filled in by the tool or by Claude.**
