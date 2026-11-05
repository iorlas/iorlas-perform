# video: contracts

Field names below are taken from the engine branch (`scripts/videodesign.py`, `videoplan.py`, `video/engine/`). Marked **spec** = decided, not yet in code.

## Rig freeze (video/rigs, already on main)
```
video/rigs/<id>/<semver>/  rig.json  rig.lock  art/  variants/  golden/(png + harness)  RIG.md
video/rigs/verify.py
```
- A released version is **immutable**. Patch = numbers; minor = additive expression/pose/part; major = renamed parts, moved pivots, changed meaning of a parameter.
- `rig.lock`: `{id, version, algorithm: sha256-tree-v1, sha256, files{path: sha256}}`. The hash is over sorted lines `<path>\0<file sha256>\n` of every file except `rig.lock` and `golden/*.png`. Written once with `verify.py --lock <dir>`, which refuses to overwrite.
- `verify.py` fails on hash drift and on any part/expression/pose in `rig.json` missing from the art module.
- The engine recomputes the hash of the **vendored copy** it stages (that is what Chrome loads) and aborts before render with `RIG TAMPERED` naming the file. Missing rig, wrong id, major mismatch: hard error. No stand-in, ever.
- A character refers to a rig as `id@semver`. A scene pins it; the engine refuses a major mismatch.
- Adding a pose: new version dir (copy, bump, edit, lock, golden). See video-art `rigs.md`.
- Test (required, exists on the engine branch): tamper one art file, one `RIG.md`, set a wrong version -> all three refused, drifted file named.

## Design file (per scenario) `scene-design/2`
Next to the scenario: `<name>.design.json`. Shape (see `design-template.md` for the human sheet it comes from):
```
{ "schema": "scene-design/2", "offscreen": ["<voice>"],
  "cast":   { "<voice>": { "offset": [dx, dy] } },        // overrides of the world layout cast entry
  "stage":  { "H": <person height>, "floor": y, "bases": {...} },   // one scale, named anchors
  "sets":   { "<set id>": { "art": "<id>", "variant": "night", "remove": [...], "props": [...], "objects": [...] } },
  "props":  { "<id>": {...} },  "screens": { "<name>": { "kind": ... } },
  "scenes": { "<## heading>": { "set": "...", "transition_out": {"type": "time_card", "text": "..."},
      "shots": [ { "id": "1.1", "beats": [1], "frame": "wide|medium|close|insert|inset",
                   "focus": "<one subject>", "subjects": ["<id>", ...], "place": "left_third|right_third",
                   "cast": [...], "props": [...], "push_in": 0.8,
                   "inset": { "set": "...", "cast": [...], "rect": [x,y,w,h], "frame": "medium", "focus": "..." } } ],
      "cues":  [ { "beat": 2, "actor": "<voice>", "expr": "wince" },
                 { "beat": 2, "offset": 1.0, "target": "<prop>", "screen": "<name>" } ] } } }
```
- A **beat** is a turn or a sound effect, counted from 1 in time order. A shot starts a little before its first beat; the first shot of a scene starts with the scene.
- `focus` = the one thing the viewer should look at (attention rule AR1, video-art). `subjects` = every thing the beat is about (people, a prop, a screen): the camera is computed from `subjects`.
- Cue channels: `state`, `expr`, `pose` (plus `screen_text`, `led`, `shake`). Gaze, body pose and camera moves stay static unless authored.
- Shot types are the keys of the world's `frames` map: `wide`, `medium`, `close`, `insert`, `inset`.

## Camera: union box with zoom clamp
`subjects_camera(boxes, frame, canvas, place, push_in, margin=0.12)`:
1. union of all subject boxes plus 12 % margin on each side;
2. fitted to the frame's aspect;
3. never narrower than the floor: `wide` = full canvas; `medium` = half canvas for one subject, `canvas/MAX_ZOOM` for several; `MAX_ZOOM = 1.6`; `insert` = free;
4. `close` with more than one subject raises: "a close-up is for a single subject";
5. `place` (`left_third`/`right_third`) shifts a single subject by w/6 onto that third (AR5/AR7);
6. a push-in ends on the tightest view that still holds every subject;
7. the box is clamped inside the canvas;
8. gate: a subject box not fully inside the final camera is an error naming the shot and the subject.
**Spec for portrait (Shorts):** same function, canvas is the 9:16 crop window moving over the wide art; MAX_ZOOM and the floor come from the format profile; one subject per shot is the default (see shorts `spec.md`).

## shots.json (`shots/1` base, `shots/2` when a scene has a shot list)
```
shots/1: { "schema", "scene", "title", "fps", "size":[w,h], "duration", "camera":{"viewBox"}, "background",
           "actors": [ { "id", "rig":"<id>@<semver>", "layer", "pose", "offset", "mouth":"mouth_<id>.json", ... } ],
           "tracks": [ { ..., "keys": [ {"t", ...} ] } ],          // state / expr / pose channels, keys sorted by t, a key at t=0
           "captions"? }
shots/2 adds: "set", "shots": [ { "id","t0","frame","focus","subjects","cast","props","camera":{"viewBox","push_to"?},
                                   "inset"?{...,"slide":{"t0","dur"}}, "overlays"?[ {"t0","t1","states"?,"grow"?,...} ] } ],
              "sets":{}, "props":{}, "screens":{},
              "transitions":[ {"type":"time_card"|"card_out","text","t0","t1","fade"} ], "debug"?: true
```
Shot `t0` = anchor time of its first beat minus a lead of 0.15 s (first shot = 0); shots must be in strict time order. An overlay with no `until` stays to the end of its shot; an overlay meant to last a scene must be ONE overlay for the scene, not one per shot (the flashback label flickered when it re-entered at each shot; fixed on the engine branch 2026-11-05).
- Engine-neutral: every number is resolved; the Node side does no design decisions.
- `mouth_<actor>.json`: one openness 0..1 per frame, from the **per-turn** RMS of that actor's turns, normalised per turn.
- Draw order: set -> props -> cast -> inset -> captions -> transition overlay (`core.js`).
- Labels and debug text only with `debug: true`; a normal render has none (lesson 2026-11-04).

## Two cast layers and overlays
- Sets may carry two cast layers (behind and in front of furniture): a table or counter in `mid_front` hides rig gaps.
- **Overlay vs set:** a *set* is a place with a floor, a depth stack and an order (video-art grammar). An *overlay* (phone card, waveform, chat bubble, call inset, tape label, time card, wall-screen state) is drawn in screen space or on a named prop; it has a fixed position and size per scene (AR7), it slides in from an edge only over a close-up and never over a face (AR6), and it is **one constant element for its whole scene**: it does not re-enter per shot (lesson 2026-11-05, flickering label).
- Embedded scene (a call, a memory): its own set and own camera, in a framed inset; design it, do not paste a full-screen text.

## Timeline v2 / v3
v2 (on branch): scenes, turns with start/end, sfx, `ambience`. v3 **spec**: add `words: [{w, t0, t1}]` per turn from forced alignment; used for subtitles, the noun-on-screen check, mouth timing.

## Per-world files (spec)
`<profile>/video/layout.json` (cast map, cameras, looks, background), `rigs.json` (which `id@semver` the world uses), `sets/`, `format` name. Engine takes `--world`.
