---
name: world-bootstrap
description: Scaffold a brand-new world (a series with its own characters, voices, rigs, sets and format) and run one episode of it with human stop points: the new-world checklist, the profile layout with a video/ part, the `episode` flow, and an optional idea-matrix scorer to choose the next idea. Use for "new world", "new series", "start another show", "bootstrap a channel", "what does a new world need", "pick the next episode idea". Writing the script is scenario, voices are voice/perform, drawing is video-art, rendering is video, vertical format is shorts.
---

# world-bootstrap

Two calls, the same shape as an outside creator's "Prompt 1 / Prompt 2" workflow, adapted to our tools:
**bootstrap** installs a studio for a world once; **episode** runs one episode with human stops.

Repo rule: worlds and scenarios are unconnected. Repo code and skills name no character, rig, set or voice. Everything specific lives in the world's profile dir; per-world scripts may live there and call the universal ones. Test: delete a world, nothing else breaks.

## Bootstrap (once per world)
```
uv run ${CLAUDE_SKILL_DIR}/../../scripts/profiles.py new <name>      # the template; then fill in the checklist order
```
1. Run `checklist.md` top to bottom with Denis; each item has a done-test. Stop points: STOP after the world doc (1), after casting (2), after the look of each main character (3), after the style grammar and first set (4-5), after the format (6).
2. Writes only into the profile dir (`profiles.py` shows where; `$PERFORM_PROFILES` or the plugin data dir; **back it up: git-init it**).
3. Nothing from the old world is reused except universal rigs and the kit; a character in a new world is a new rig or a new variant.

## Episode (every episode)
```
0 pick idea      (idea-matrix.md optional)                       STOP  Denis picks
1 hook + script  scenario skill: premise ... table read          STOP  Denis approves text
2 voices         perform: cast, render audio, listen             STOP  Denis approves by ear
3 design sheet   video skill design-template.md; census; rig gaps  STOP  Denis approves sheet
4 art            video-art: missing sets/props/rig versions       STOP per image
5 draft render   720p draft + contact sheet + QA, own 5 weakest spots fixed first
6 review         STOP  Denis accepts or lists defects -> lessons.md
7 deliver        mp4 (+ shorts packaging when vertical), notes.md, canon update (scenario step 11)
```
Everything between stops is autonomous. Never skip a stop to save time: a wrong premise costs a full render.

## Files
| file | holds |
|---|---|
| `checklist.md` | the 8 items a world supplies, with done-tests and where each lives; the profile layout with `video/` |
| `idea-matrix.md` | the optional situation x place scorer |
