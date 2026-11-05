# Toolkit audit, 2026-11-05 (read-only; nothing else touched)

Sources: git state of the 3 checkouts, file listings, `diff` of skills vs the plugin cache, grep. Not run: renders, tests. "Not found" = absent in the 3 checkouts + ru-voice-clone.

## 1. Map: where everything lives

| Place | Holds | Status |
|---|---|---|
| `iorlas-perform` (main) | plugin 0.5.0: skills perform/voice/scenario, `scripts/*.py`, voices | **canonical for audio + skills**. `origin/main` is 9 commits behind local: unpushed. Remote has only `main` |
| main, uncommitted | `scripts/scene.py` whisper leveling (`level_hushed`, WHISPER -19 dB / HUSH -21 dB RMS, applied after the take-cache read), staged `.beads/issues.jsonl`, `uv.lock`, two `.DS_Store` | **stranded**: no commit, no test, no skill line |
| `-rig-freeze` (branch `rig-freeze`) | 10 commits not in main: 11 rigs frozen under `video/rigs/<id>/<ver>/` (hash-locked), `video/rigs/README.md`, `verify.py` | **local only, never pushed**; canonical for rigs |
| `-video-spike` (branch `spike/video-engine`) | 38 commits: Remotion engine `video/engine`, `scripts/video*.py`, `video/layout.json`, `video/art` (sets), tests, 3 `examples/*.design.json` | **local only, never pushed**; canonical for engine. Its `video/rigs` is byte-identical to rig-freeze (copied, not merged) |
| `.claude/worktrees/upbeat-jang-cb2a7a` | detached HEAD, old merge | scratch, delete |
| `ru-voice-clone/` | **not a git repo**. `art/` (sets A-F, cards, stress: 10 MB), `scenarios/pravila/` (md v1-v3, design, set_census, `render/` 55 MB), `research/`, plus 2026-10 prototypes (`clone.py`, `speak*.py`, `drama3*`, `queue*.sh`, `stories/` 222 MB, `scenes/` 48 MB, `out.wav`) | **art + scenario design exist only here, no history, no backup**. Old scripts duplicate `iorlas-perform/scripts` |
| plugin cache `~/.claude/plugins/cache/.../iorlas-perform` | 0.1.0-0.4.0; **installed = 0.4.0** (no `scenario` skill, no `sound-design.md`) | stale copy; the live skill the agent loads is not main |
| profile `.../profiles/senior-vadik/` | `world.md arcs.md characters.md relationships.md profile.md taste-log.md style-volshebny.md`, `entities/` (11), `episodes/` (4), `voices/`, `levels.old-voices.json`, `renders/` (wav+timeline, ep 00-03), `drafts/`, `voices-old-2026-10-28` | **canonical for the world**; user-data dir, no git, no backup |
| `~/Library/.../side-session-notes/local_33f5...` | spike report, voice-science, night_shift RCA, stress visuals, set tooling (`*.mjs`) | **session notes only**; `set*.mjs` / `shot.mjs` tooling exists nowhere else |
| `/tmp`-style scratch | per-session scratchpads | gone when sessions close |

```
 main (9 unpushed, +dirty scene.py) --o--o--o
                         \ rig-freeze (10)  o--o--o   rigs
                          \ spike/video-engine (38) o--...--o   engine, contains COPY of rigs
 ru-voice-clone/art + scenarios   (no git)          profile dir (no git)
```

**Divergence trap:** spike branched at `8903fea`; main then added `99cec7a` (modes: `skills/scenario/modes/ru-comedy/*`, `modes.md`). The spike diff shows those files as *deleted*; a merge keeps main's, but `skills/scenario/SKILL.md` (+78 in spike) and `ledger.md` will conflict. `scripts/scene.py` changed on spike (+10) and uncommitted on main.

**Missing:** `dev/release.py` was named as the release tool; it exists only in `~/Workspaces/iorlas-task-loop*` (a different plugin), none of the 3 perform checkouts (`dev/` absent). Item 9 can copy it from there. Rig versioning is documented (`video/rigs/README.md`: released = immutable, patch/minor/major, `rig.lock` sha256-tree, scene cache key includes rig hash). **Plugin** release rules (when to bump 0.5.0, how the cache refreshes) are written nowhere; plugin.json says 0.5.0 while installed is 0.4.0.

## 2. Skills inventory vs lessons

| Skill / doc | Covers | Stale / missing |
|---|---|---|
| `perform` (103 l) | scenario to wav + timeline, take cache, Whisper check per take, gains per voice | no video; no whisper leveling; cache key text lacks `TAKES_VERSION` meaning |
| `perform/sound-design.md` | LUFS, ambience, effects | fine |
| `voice` (119 l) | single voice, tags, cloning, design | fine for audio; seed/casting lint lives in scripts, only partly in text |
| `scenario` (486 l) + craft, format, ledger, modes, profiles, structure-research | script writing, ru-comedy mode, ear rules T11-T15, ledger | 486-line SKILL is oversized; no Shorts route beyond "short-scene"; world profile is `profiles.md` (audio-era) |
| **video** | **no skill at all.** Knowledge sits in `video/engine/README.md`, `video/rigs/README.md`, `video/spike/REPORT.md` (spike branch only), docstrings of `video.py`/`videoplan.py`/`videodesign.py` | everything below |

Lessons and where each lives today:

| Lesson | In a skill? | Where it is now | Home |
|---|---|---|---|
| (a) two-language pipeline: Python owns timeline v2, sheet, resolver, mouth, writes `shots.json`; Node/Remotion renders; rig freeze, hard errors on missing/tampered rig (`RIG TAMPERED`), per-scene cache key | no | `video.py` docstring, rigs README, engine README | `video` |
| (b) set/overlay principle, tiers A/B/C, style grammar, AR1-AR7, `subjects` per shot, union-box camera | no | `set_census.md` §rules (ru-voice-clone), commit msg 830ae14 | `video-art` |
| (c) art review: one image at a time, flat cut paper, hands <= 1.3x wrist, no gradients | no | the art sessions' prompts only (not found in any file) | `video-art` |
| (d) whisper leveling | no | uncommitted code + docstring | `perform` |
| (e) table read with Sonnet actor subagents that object aloud | no | **not found in any file** (only in session memory) | `scenario` (check step) |
| (f) per-scenario design sheet (`pravila.design.md`: census, shots by scene, spare places) | no | `scenarios/pravila/`, format also in `videodesign.py` JSON | `video` template |
| (g) unpushed state, release rules | no | nowhere | `video` + repo README/CLAUDE.md |

## 3. Gaps for new worlds

Hard-coded to «Сеньор Вадик» (found by grep):

| Where | What | Fix |
|---|---|---|
| `video/layout.json` | one file: cast voice to rig, cameras by actor set (`mihalych`; `palych,vadik,zinaida`), looks, background, props, Zinaida screen rules, Mihalych pairing note | per-world `layout.json` in the profile; engine takes `--world` |
| `video/rigs/` | 11 rigs inside the plugin repo; `videoscene.py` special-cases Mihalych (seated pose, no legs) | rig library = shared; world file lists which rig ids it uses; seated/legless as a rig capability flag, not a name check |
| `video/art/` sets + `core.js` (`HF.SNAP`: "female rigs") | Vadik-office sets A-F | set library per world; snap set by rig metadata |
| `scripts/calibrate.py`, `voice_similarity.py`, `design_voice.py` | profile name and example numbers in docs/docstrings | cosmetic; take profile from arg |
| `scripts/scenario.py` docstring, `videodesign.py` | example uses vadik | cosmetic |
| `layout.json` size/fps | fixed 1280x720, 30 fps; camera viewBox 1564x880 | **format profile**: `landscape-720`, `shorts-1080x1920`; frame widths per format |
| profile dir | world + voices are already per-profile: good | add `video/` (layout, rig list, set list) beside `world.md` |

New world checklist (what a world supplies):

| # | Item | Today |
|---|---|---|
| 1 | `profile.md`, `world.md`, `characters.md`, `relationships.md`, `taste-log.md` | exists for vadik |
| 2 | Voices per character, levels, casting lint pass | per profile |
| 3 | Rigs (frozen, locked, golden PNG) for each cast member + props | vadik-only |
| 4 | Set census: places, tier, time of day, recurrence | per scenario |
| 5 | Style grammar and palette (one doc, AR rules reused) | in `set_census.md` |
| 6 | `layout.json`: cast map, cameras, looks, format | single global |
| 7 | Intro/end cards, sting, brand line | vadik cards in `art/cards` |
| 8 | Series bible: running gags, callbacks (ledger) | `arcs.md` |

**Shorts (9:16, <60 s) is unsupported:** no 9:16 canvas, no camera frames for portrait (union-box camera tuned to wide 16:9 sets; sets drawn wide), no hook rule (first 1-2 s), no length gate (<60 s), no loop/end rule, subtitles burned? not found. The `scenario` short-scene route targets audio length only. Shorts also needs vertical set crops: sets are wide drawings, a portrait crop shows one actor at a time (AR1 helps).

## 4. Target structure and work list

**Rule (Denis, 2026-11-05):** worlds and scenarios are unconnected. Repo code and skills are universal: no character, rig, set or voice name in `scripts/`, `video/engine`, `skills/`. Everything specific lives in the world dir (profile). Custom per-world scripts are allowed, but live in the world dir and call universal ones. Test: delete the vadik profile, every script and skill still runs with another world.

```
iorlas-perform (git, pushed)
  skills/ perform voice scenario video video-art world-bootstrap shorts
  scripts/ (audio)   video/engine  video/rigs (shared library)  video/formats/*.json
  dev/release.py (new)   docs/RELEASING.md
profile dir (per world, backed up in own git)
  world docs, voices, video/{layout.json, rigs.json, sets/}, renders/
ru-voice-clone  -> archive; art + scenarios move into profile/scenarios/<slug>/{design.md,census.md,art/}
```

| # | Work | Where | Size | Risk | Breaks without it |
|---|---|---|---|---|---|
| 1 | Backup now: `git init` or copy ru-voice-clone `art/` + `scenarios/` (about 65 MB, excl. `render/`); push rig-freeze and spike as branches | ru-voice-clone, origin | S | none | one disk loss kills all art and 38 commits of engine |
| 2 | Commit `level_hushed` + test + 3 lines in `perform` | main | S | low | whisper fix lost; cached takes stay quiet |
| 3 | Merge plan below, then bump 0.6.0, refresh plugin cache | main | M | med: SKILL.md conflict | installed 0.4.0 has no scenario/video skills, so new sessions miss all rules |
| 4 | Skill `video`: pipeline, `shots.json` contract, rig freeze, cache key, errors, render/test commands, design-sheet template (f) | skills/video | M | low | next world re-learns the spike |
| 5 | Skill `video-art`: set/overlay, tiers, grammar, AR1-AR7, `subjects`, review process (c), hand/line rules | skills/video-art | M | low | art sessions diverge in style again |
| 6 | Table-read check (e): roles as Sonnet subagents, objections, how to fold into the script | `scenario` check step + `perform` note | S | low | script bugs found only by ear, after render |
| 7 | De-hardcode: `--world`, layout in profile, rig-capability flags, format profiles; remove name checks | `video.py`, `videoplan.py`, `videoscene.py`, `core.js` | L | med: engine golden tests must stay green | a second world means forking the repo |
| 8 | Shorts route: 9:16 format, portrait cameras, hook rule, <60 s gate, intro sting, loop end; skill `shorts` | scripts + new skill | L | high: art is wide | no vertical output |
| 9 | `dev/release.py` + RELEASING.md: bump plugin version, rig freeze steps, cache refresh | dev/ | S | low | version drift (0.5.0 vs 0.4.0 installed) |
| 10 | Trim `scenario/SKILL.md` (486 l) into the sub-docs; move `structure-research.md` out of the skill load path | skills/scenario | M | med | context bloat on every scenario run |
| 11 | Skill `world-bootstrap`: checklist of section 3, scaffolds a profile | skills/ | M | low | new world starts from nothing |
| 12 | Cleanup: delete `upbeat-jang` worktree, old ru-voice-clone prototypes, `.DS_Store` in `.gitignore`, commit `uv.lock` | repos | S | low | noise |

**Merge/push plan (no actions taken):**

1. Commit `level_hushed` on main (item 2) and push main (9 commits + 1).
2. Merge `rig-freeze` into main (rigs are new files, no conflicts), run `video/rigs/verify.py`, push.
3. Rebase `spike/video-engine` onto that main: rig files are byte-identical so adds collapse; resolve `skills/scenario/SKILL.md`, `ledger.md` by hand, keep main's `modes/` (spike's "deletions" are artifacts of the older base), keep both `scene.py` edits; run the test suite and one golden render.
4. Push as `video-engine` branch, review, merge to main; tag plugin 0.6.0; refresh cache.
5. Add skills 4-6 in the same release; 7-8 after.

Order of value: 1, 2, 3, 4, 5, 6 now (about a day); 7, 8 before the first Shorts world.
