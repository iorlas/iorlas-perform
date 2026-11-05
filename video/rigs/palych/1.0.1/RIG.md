# palych 1.0.1 - cut-paper rig

Approved look: cast option "v". Gennady Palych, IT director, 55, ex-praporshchik in ill-fitting office clothes. Block flat-top head, grey bristle crop, mustache, stocky build with a thick visible neck (about 36 px between chin and collar), knit vest over a pale shirt and tie, short shirt sleeves, brown leather oxfords. Flat filled paper shapes, no outlines, soft drop shadow per part (`look: cutout`). Same construction, joints and draw contract as `vadik@1.0.0`.

- Machine-readable spec: `rig.json`. Art: `art/palych_cut.js`, seed 11, pure function of (state, t). Needs `HF.hash` from the engine. Engine verbs: pose, express, gaze, turn_head, lean, move, hold. Optional `actor.tether`.
- Registers: `HF.RIGS.palych`, `HF.RIG.palych` (data, `.expr`, `.poses`, `.variantDefault`), `HF.CHARS.palych_cut`. Expressions and poses are NOT written to the shared `HF.EXPR` / `HF.POSES` (names would collide with other rigs); the integration reads `HF.RIG.palych.expr` / `.poses`.
- Local space: origin neck base, +y down, hips y=230, floor y=516.
- Expressions: Vadik's 8 (neutral_anxious, wince, side_glance, panic, pretend, shame, realize, blank) plus bark (down the chain), clerk (up the chain), proud, and side_glance_l (mirror). Default: neutral_anxious. `slide` is a no-op (no glasses), kept for schema parity.
- Poses: stand_still, stand_fidget, hold_receiver, point_order (arm out, hand kind `point`), hold_prop (right hand at chest).
- Habit prop: thermos (`prop_thermos`, `props` in rig.json). Detachable, default off. `st.prop = {on:true, at:"hand"|"side", hand:"R"|"L"}`; hand mode anchors to the palm of that hand, upright, tilt from pose `L/R.pr`; side mode tucks it against the belly. Not drawn when `st.prop` is absent or `on` is false.
- Helpers (geometry, eye, brow, mouth, nose, handset, assembler, rim light) are duplicated verbatim from `vadik_cut.js`, not shared: `verify.py` hashes only the files inside one version dir, and `vadik/1.0.0` is immutable.
- `golden/`: `golden.png` (all expressions as busts, stand_still, stand_fidget, hold_receiver, point_order, hold_prop with thermos ON), built by `golden/render.mjs` from `golden/golden.html` with the verbatim spike harness in `golden/harness/`.

Known weaknesses: yaw above ~0.6 degrades; thermos small at golden scale; no walk cycle (back view added, see below); hands are mittens.

## Mouth system v2
Data-driven, same code in all three rigs, per-character styling in `R.mouth` (`rig.json` parameters.mouth_style). Channels per expression: `mw` width, `mc` curve (+smile / -frown), `ms` lopsided smirk, `mo` base open (dark interior, lip outline, jaw drop), `mt` upper-teeth strip, `mg` tongue, `wob` gritted-teeth grimace; `lk` removes the half-lid for wide eyes. `st.mouth` = `mouth_open` 0..1 (lip-sync amplitude) layers on top of the expression: closed 0, small 0.3, mid 0.6, wide 1 (`R.visemes`); opening height and jaw drop scale with it, teeth and tongue appear automatically from mid up.
- Mustache lifts with smile and mouth opening; the mouth sits under it with a visible gap. proud = wide closed smirk, clerk = symmetric half-open small smile with teeth, pretend = nervous lopsided closed line, bark/panic = open mouth with teeth and tongue, wince = gritted teeth, shame = deep frown.

## Feet
Toes OUT in a V: pose.legs.fl:-1, fr:1, rotL -11 / rotR +12 deg, q34 0.9/0.8 (same convention as vadik 1.1.0).

## Hair anchoring + back view (fix, client report "the pointy hair walked outside the head")
- Tufts/bristles/strands: root x = rest x * (hwid / rest hwid) * (0.8 + 0.2 cos yaw) + fx*0.3, clamped inside the crown. Was x + fx*0.45 with no scaling, so at yaw >= 45 deg roots left the narrowed skull and moved faster than the cap. Yaw 0 is unchanged.
- Hair crop: still shifted by fx*0.3 with yaw, now clipped to skull + rest crop silhouette (clip on an unshifted wrapper inside the drop shadow), so it never overhangs the head on the lead side.
- Eyes and brows clipped to the skull (the lead brow poked out past the head at yaw >= 45 once the cap stopped covering it); the mouth stays unclipped because the jaw drop extends below the chin.
- Back view: `pose.back` or `pose.head.back` (key already in the pose schema, was ignored). `P.head_back`: ears at the sides behind the skull, grey crop from the flat top to a straight clipper line with a short stubble fade, no face features; head yaw forced to 0; nose, face, mustache, front crop, tie, vest V and buttons skipped. Vest back is plain; `P.collar_back` draws the shirt collar band around the nape.
- Tilt and gaze up/down were already correct (the whole head group rotates; pitch moves only face features).
- Not fixed: at yaw ~0.8 a thin skull sliver can show on the trailing side above the ear; the back view has no yaw or 3/4-back variant. The cast-sheet cell "Нейросеть б" (poc_cast7 obj7.js) hand-paints its own back-of-head with misplaced tufts and does not use this rig; it needs re-rendering through `pose.back`.

## 1.0.1 changes (panic fix, from 1.0.0)
- panic reads as fear, not as a laugh: eyes bigger (new channel `big` 0..1: eye rx +22%, ry +30%, pupil +12% at 1; panic uses 0.6), whites visible, larger pupils (pup 0.95), brows raised and worried (inner ends up), `sweat` drop at the temple.
- Mouth: small oval, corners DOWN (mc -1), mw 0.56, mo 0.85, no teeth, no tongue (mt 0, mg 0). The old wide open mouth with teeth and tongue read as laughing.
- New channels default to 0 (gr: 1) in every other expression: all other expressions render unchanged. Art edit: `EX0`, `P.eye`, `P.face` (sweat drop), panic row. 1.0.0 stays intact.
