# vadik 1.3.0 - cut-paper rig (mouth overhaul of 1.0.0)

Approved look: variant 1 "Исходный вариант". Neutral_anxious baseline, clean shaven, rectangular dark glasses, soft light-brown tufts. Flat filled paper shapes, no outlines, soft drop shadow per part (`look: cutout`).

- Machine-readable spec: `rig.json` (parts, pivots, expressions, poses, parameters, required engine verbs, palette).
- Art: `art/vadik_cut.js`, verbatim from the spike (poc_rig4). Registers `HF.RIGS.vadik`, `HF.RIG.vadik`, `HF.EXPR`, `HF.POSES`, `HF.VARIANT_DEFAULT`, `HF.CHARS.vadik_cut`. Pure function of (state, t); randomness only through `HF.hash(seed...)`, seed 7.
- Needs `HF.hash` from the engine's `hf.js`. Engine verbs used: pose, express, gaze, turn_head, lean, move, hold. Optional `actor.tether` (cord).
- Local space: origin neck base, +y down, hips y=272, floor y=612.
- Expressions: neutral_anxious, wince, side_glance, side_glance_l (mirror), panic, pretend, shame, realize, blank. Poses: stand_still, stand_fidget, hold_receiver, flinch.
- `variants/variants.json`: parked parameter sets (stubble, beards, etc.), already data in the spike. Not part of the approved look.
- `golden/`: `golden.png` (8 expressions + stand_fidget, baseline, t fixed), built by `golden/render.mjs` from `golden/golden.html` using `golden/harness/` (verbatim spike engine helpers `hf.js`, placeholder `poses.js`, `puppet.js`). The harness copies are test scaffolding, not the engine.

Known weaknesses (from the spike): yaw above ~0.6 degrades; face about 100 px wide in wide shots; side_glance and shame read close to neutral_anxious at small size; no walk cycle (back view added, see below); hands redrawn in 1.2.1 (palm + fingers + thumb); legs long and thin.

## Mouth system v2
Data-driven, same code in all three rigs, per-character styling in `R.mouth` (`rig.json` parameters.mouth_style). Channels per expression: `mw` width, `mc` curve (+smile / -frown), `ms` lopsided smirk, `mo` base open (dark interior, lip outline, jaw drop), `mt` upper-teeth strip, `mg` tongue, `wob` gritted-teeth grimace; `lk` removes the half-lid for wide eyes. `st.mouth` = `mouth_open` 0..1 (lip-sync amplitude) layers on top of the expression: closed 0, small 0.3, mid 0.6, wide 1 (`R.visemes`); opening height and jaw drop scale with it, teeth and tongue appear automatically from mid up.
- 1.1.0 (minor, from 1.0.0): new mouth system; panic is a scream-gasp, wince gritted teeth, realize a round gasp, pretend a lopsided nervous grin with teeth. `st.mouth` now drives the full open mouth (was a 0.35 nudge to `mo`); parameter meaning changed for lip-sync callers, 1.0.0 stays intact.

## Feet (1.1.0)
Toes point OUTWARD in a V (pose.legs.fl:-1, fr:1; rotL -11, rotR +12 deg tip toes toward viewer, q34 0.9/0.8), same shoe, same ankle/ground contact, all poses. 1.0.0 had toes-in (fl:1, fr:-1) from an early "unconfident stance" brief: superseded. Unconfident feel comes from posture and expression only. Same convention applied to palych 1.0.0 and stas 1.0.0, which were also toes-in in code (unreleased).

## Hair anchoring + back view (fix, client report "the pointy hair walked outside the head")
- Tufts/bristles/strands: root x = rest x * (hwid / rest hwid) * (0.8 + 0.2 cos yaw) + fx*0.3, clamped inside the crown (y re-evaluated on the crown curve). Was x + fx*0.45 with no scaling, so at yaw >= 45 deg roots left the narrowed skull and moved faster than the cap. Yaw 0 is unchanged.
- Hair cap: still shifted by fx*0.3 with yaw, now clipped to skull + rest cap silhouette (clip on an unshifted wrapper inside the drop shadow), so it never overhangs the head on the lead side.
- Eyes and brows clipped to the skull (the lead brow poked out past the head at yaw >= 45 once the cap stopped covering it); the mouth stays unclipped because the jaw drop extends below the chin.
- Back view: `pose.back` or `pose.head.back` (key already in the pose schema, was ignored). `P.head_back`: ears at the sides behind the skull, glasses temple hooks over the ears, light-brown hair from crown to a pointed nape hairline with a crown whorl, no face features; head yaw forced to 0; nose, face, glasses lenses, front cap, lanyard V and badge skipped. The lanyard shows as a strap across the nape.
- Tilt and gaze up/down were already correct (the whole head group rotates; pitch moves only face features).
- Not fixed: at yaw ~0.8 a thin skull sliver can show on the trailing side above the ear; the back view has no yaw or 3/4-back variant. The cast-sheet cell "Нейросеть б" (poc_cast7 obj7.js) hand-paints its own back-of-head with misplaced tufts and does not use this rig; it needs re-rendering through `pose.back`.

## 1.2.0 changes (panic fix, from 1.1.0)
- panic reads as fear, not as a laugh: eyes bigger (new channel `big` 0..1: eye rx +22%, ry +30%, pupil +12% at 1; panic uses 0.55), whites visible, larger pupils (pup 0.9), brows raised and worried (inner ends up), `sweat` drop at the temple.
- Mouth: small oval, corners DOWN (mc -1), mw 0.52, mo 0.85, no teeth, no tongue (mt 0, mg 0). The old wide open mouth with teeth and tongue read as laughing.
- Glare: new channel `gr` scales the white glare streaks on the lenses; panic gr 0 so the eyes show through the glasses.
- New channels default to 0 (gr: 1) in every other expression: all other expressions render unchanged. Art edit: `EX0`, `P.eye`, `P.face` (sweat drop), `P.glasses` (gr), panic row. 1.1.0 stays intact.

## 1.2.1 changes (hand fix, from 1.2.0)
- Hands: mitten (palm 31 px wide on a 15 px wrist, 2.1x) -> palm 19 px (1.27x wrist), 4 separate fingers, thumb. Flat skin shapes, one flat shadow shape (skin2), no strokes or gradients. Wrist pivot, length (~46 px), poses, mouth/eye anchors and every other part are unchanged; only `P.hand` changed (kinds: default and `point`).
- 1.2.0 stays intact; scenes pin `vadik@1.2.1` to get the new hands. Before/after: `golden/hands.png` shows this version only; compare with 1.2.0's golden.

## 1.3.0 changes (rail + phone poses, additive, from 1.2.1)
- Hand kinds (pose key `hand` on L/R, previously ignored by vadik): `mitten` (default, unchanged 1.2.1 hand), `grip_v` (fingers wrapped across a vertical rail; 4 separate fingers, thumb tip peeking behind, one flat shadow), `phone` (hand holding an upright phone: body, plain screen, 3 finger bumps on one edge, thumb on the other).
- New pose key `abs`: absolute hand angle in degrees (replaces forearm angle + rot) so a gripping hand stays vertical whatever the forearm does.
- New poses: `grip_rail` (R arm raised, hand on a rail at actor x ~84, elbow out, L hand down) and `grip_rail_phone` (same plus L hand holding a phone at hip height, hand kind `phone`).
- Documented slots in rig.json `anchors`: `hand_rail_axis` (rail axis = hand-local line x=0, draw the rail before the hand) and `hand_phone_screen` (screen rect for overlays).
- Other poses and parts unchanged; 1.2.1 and older stay intact. `golden/poses_rail.png` shows the new poses against a placeholder rail.
