# vadik 1.0.0 - cut-paper rig

Approved look: variant 1 "Исходный вариант". Neutral_anxious baseline, clean shaven, rectangular dark glasses, soft light-brown tufts. Flat filled paper shapes, no outlines, soft drop shadow per part (`look: cutout`).

- Machine-readable spec: `rig.json` (parts, pivots, expressions, poses, parameters, required engine verbs, palette).
- Art: `art/vadik_cut.js`, verbatim from the spike (poc_rig4). Registers `HF.RIGS.vadik`, `HF.RIG.vadik`, `HF.EXPR`, `HF.POSES`, `HF.VARIANT_DEFAULT`, `HF.CHARS.vadik_cut`. Pure function of (state, t); randomness only through `HF.hash(seed...)`, seed 7.
- Needs `HF.hash` from the engine's `hf.js`. Engine verbs used: pose, express, gaze, turn_head, lean, move, hold. Optional `actor.tether` (cord).
- Local space: origin neck base, +y down, hips y=272, floor y=612.
- Expressions: neutral_anxious, wince, side_glance, side_glance_l (mirror), panic, pretend, shame, realize, blank. Poses: stand_still, stand_fidget, hold_receiver, flinch.
- `variants/variants.json`: parked parameter sets (stubble, beards, etc.), already data in the spike. Not part of the approved look.
- `golden/`: `golden.png` (8 expressions + stand_fidget, baseline, t fixed), built by `golden/render.mjs` from `golden/golden.html` using `golden/harness/` (verbatim spike engine helpers `hf.js`, placeholder `poses.js`, `puppet.js`). The harness copies are test scaffolding, not the engine.

Known weaknesses (from the spike): yaw above ~0.6 degrades; face about 100 px wide in wide shots; side_glance and shame read close to neutral_anxious at small size; no back view or walk cycle; hands are mittens; legs long and thin.
