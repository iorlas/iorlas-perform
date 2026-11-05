# stas 1.0.2 - cut-paper rig

Approved look: cast option "2". Stas, QA engineer, 26. Dark fringe over the screen-right eye, knit sweater, teal lanyard with a ticket badge, deadpan half-lidded eyes set slightly sideways (baseline gx 0.35), slim-average build, dark sneakers. Flat filled paper shapes, no outlines, soft drop shadow per part (`look: cutout`). Same construction, joints and draw contract as `vadik@1.0.0`.

- Machine-readable spec: `rig.json`. Art: `art/stas_cut.js`, seed 13, pure function of (state, t). Needs `HF.hash` from the engine. Engine verbs: pose, express, gaze, turn_head, lean, move, hold. Optional `actor.tether`.
- Registers: `HF.RIGS.stas`, `HF.RIG.stas` (data, `.expr`, `.poses`, `.variantDefault`), `HF.CHARS.stas_cut`. Expressions and poses are NOT written to the shared `HF.EXPR` / `HF.POSES` (names would collide with other rigs); the integration reads `HF.RIG.stas.expr` / `.poses`.
- Local space: origin neck base, +y down, hips y=250, floor y=568.
- Expressions: Vadik's 8 (neutral_anxious, wince, side_glance, panic, pretend, shame, realize, blank), deadpan (default), flat_stare_at_off (eyes sideways, flat), file_it (tiny eyebrow lift on screen-left, the tell), and side_glance_l (mirror). `slide` is a no-op (no glasses), kept for schema parity.
- Poses: stand_still, stand_fidget (right hand on the lanyard), hold_receiver, hold_prop (right hand at chest).
- Habit prop: notebook (`prop_notebook`, `props` in rig.json). Detachable, default off. `st.prop = {on:true, at:"hand"|"side", hand:"R"|"L"}`; hand mode anchors to the palm of that hand, upright, tilt from pose `L/R.pr`; side mode tucks it against the hip. Not drawn when `st.prop` is absent or `on` is false.
- Helpers (geometry, eye, brow, mouth, nose, handset, assembler, rim light) are duplicated verbatim from `vadik_cut.js`, not shared: `verify.py` hashes only the files inside one version dir, and `vadik/1.0.0` is immutable.
- `golden/`: `golden.png` (all expressions as busts, stand_still, stand_fidget, hold_receiver, hold_prop with notebook ON), built by `golden/render.mjs` from `golden/golden.html` with the verbatim spike harness in `golden/harness/`.

Known weaknesses: yaw above ~0.6 degrades; the fringe hides most of the screen-right eye and brow, so that side reads through lid and gaze only; deadpan, neutral_anxious, blank and file_it are very close at small size by design (file_it is a 4 px brow lift); no walk cycle (back view added, see below); hands redrawn in 1.0.2 (palm + fingers + thumb).

## Mouth system v2
Data-driven, same code in all three rigs, per-character styling in `R.mouth` (`rig.json` parameters.mouth_style). Channels per expression: `mw` width, `mc` curve (+smile / -frown), `ms` lopsided smirk, `mo` base open (dark interior, lip outline, jaw drop), `mt` upper-teeth strip, `mg` tongue, `wob` gritted-teeth grimace; `lk` removes the half-lid for wide eyes. `st.mouth` = `mouth_open` 0..1 (lip-sync amplitude) layers on top of the expression: closed 0, small 0.3, mid 0.6, wide 1 (`R.visemes`); opening height and jaw drop scale with it, teeth and tongue appear automatically from mid up.
- Mouth is smaller by character. panic = wide eyes (lid cover removed, small pupils), raised brows, fringe lifted and rotated off the right eye (`fl`), open mouth with teeth and tongue. file_it = left brow lifted high + tiny one-sided mouth corner.

## Feet
Toes OUT in a V: pose.legs.fl:-1, fr:1, rotL -11 / rotR +12 deg, q34 0.9/0.8 (same convention as vadik 1.1.0).

## Hair anchoring + back view (fix, client report "the pointy hair walked outside the head")
- Tufts/bristles/strands: root x = rest x * (hwid / rest hwid) * (0.8 + 0.2 cos yaw) + fx*0.3, clamped inside the crown. Was x + fx*0.45 with no scaling, so at yaw >= 45 deg roots left the narrowed skull and moved faster than the cap. Yaw 0 is unchanged.
- Hair cap: still shifted by fx*0.3 with yaw, now clipped to skull + rest bowl cap silhouette (clip on an unshifted wrapper inside the drop shadow), so it never overhangs the head on the lead side. The fringe (shift fx*0.4) is clipped to the same envelope.
- Eyes and brows clipped to the skull (the lead brow poked out past the head at yaw >= 45 once the cap stopped covering it); the mouth stays unclipped because the jaw drop extends below the chin.
- Back view: `pose.back` or `pose.head.back` (key already in the pose schema, was ignored). `P.head_back`: ears at the sides behind the skull, dark bowl from crown to a soft notched nape line, no face features; head yaw forced to 0; nose, face, fringe, front cap, lanyard V and badge skipped. The lanyard shows as a strap across the nape.
- Tilt and gaze up/down were already correct (the whole head group rotates; pitch moves only face features).
- Not fixed: at yaw ~0.8 a thin skull sliver can show on the trailing side above the ear; the back view has no yaw or 3/4-back variant. The cast-sheet cell "Нейросеть б" (poc_cast7 obj7.js) hand-paints its own back-of-head with misplaced tufts and does not use this rig; it needs re-rendering through `pose.back`.

## 1.0.1 changes (panic fix, from 1.0.0)
- panic reads as fear, not as a laugh: eyes bigger (new channel `big` 0..1: eye rx +22%, ry +30%, pupil +12% at 1; panic uses 0.6), whites visible, larger pupils (pup 0.95), brows raised and worried (inner ends up), `sweat` drop at the temple (screen-left: the fringe hides the right temple).
- Mouth: small oval, corners DOWN (mc -1), mw 0.54, mo 0.85, no teeth, no tongue (mt 0, mg 0). The old wide open mouth with teeth and tongue read as laughing.
- New channels default to 0 (gr: 1) in every other expression: all other expressions render unchanged. Art edit: `EX0`, `P.eye`, `P.face` (sweat drop), panic row. 1.0.0 stays intact.

## 1.0.2 changes (hand fix, from 1.0.1)
- Hands: mitten (palm 31 px wide, 2.1x the wrist) -> palm 19 px (1.27x wrist), 4 separate fingers, thumb. Flat skin shapes, one flat shadow shape (skin2), no strokes or gradients. Wrist pivot, length (~46 px), poses, mouth/eye anchors and every other part are unchanged; only `P.hand` changed (kinds: default and `point`).
- 1.0.1 stays intact; scenes pin `stas@1.0.2` to get the new hands. Before/after: `golden/hands.png` shows this version only; compare with 1.0.1's golden.
