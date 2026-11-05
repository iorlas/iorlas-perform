# friend 1.0.2 - female cut-paper rig

Подруга, Vadik-side friend, slightly gothic. Cast sheet18 variant 3: egg skull width 76, lob as one hair mass with the tucked side and one ear open, dark heavy-lidded eyes with a cold "I hate the world" stare, plum lips, choker with round pendant, black tee with small XX, loose dark trousers, black ankle boots. Ridiculousness dial 4. Flat filled paper shapes, soft drop shadow per whole part (`look: cutout`).

- Machine-readable spec: `rig.json`. Art: `art/female_cut.js`, seed 21, pure function of (state, t). Registers: `HF.RIGS.friend`, `HF.RIG.friend`, `HF.EXPR_F.friend`, `HF.POSES_F`, `HF.CHARS.friend`. `walk` via `HF.walkPose(phase 0..1)` (8 frames).
- The module also registers `kristina`; the same file is copied verbatim into `kristina/1.0.1` so each version hash stays self-contained.
- Body: `body_type: f`, height ~0.93 of vadik, waist ~57% of hip, bust option D (silhouette only; front +11% over shoulders, profile apex +12 px at y=82). Face contour is one G1 egg curve.
- Extra parts vs kristina: `choker`, `pendant`. Wide-mouth state +30%.
- Shading, views, walk, sit, feet, mouth states and props: same system as `kristina@1.0.1`.
- `golden/golden.png`: shared sheet with both women (see kristina RIG.md); re-render with `golden/render.mjs`.

## Changes vs 1.0.0 (patch: expression numbers + one mouth shape, additive channels)
- `panic` is now the former "C2" (Denis picked it): quiet-but-readable fear that keeps her cold look. Eyes wider (`open` 1.85, `lo` 3.7) with a ring of white round smaller irises (`irs` .8, `pup` .55), heavy upper-lid line and eyeliner kept; brows high with the inner ends up, asymmetric (`bdR` 3.5 / `bdL` -1.5); flat open trapezoid mouth with a dark interior and corners down (no cupid's bow, no teeth); pale cool cheeks, blush 0; two sweat drops.
- New extras `panic_soft` (C1: one sweat drop, smaller mouth) and `panic_hard` (C3: eyes ~1.5x, thin pupils, gritted lower teeth strip). Same channels, only numbers differ.
- New expression channels (default = old behaviour, so every other expression renders as in 1.0.0): `trap` (flat open mouth), `lt` (lower teeth strip), `pale` (cool cheek shade), `irs` (iris scale), `sweat` > 1 (second drop). Ranges widened: `open` to 2.6, `lo` to 4.2, `by` to 9, `bt*` to 11.
- The module `art/female_cut.js` is the shared file also copied into `kristina/1.0.1` (kristina's `panic` changed there too).
- `golden/golden.png` re-rendered (both women, unchanged layout); `golden/golden_panic.png` shows neutral, laughing, panic, panic_soft, panic_hard at 2x and working size (`node render.mjs golden_panic.png golden_panic.html 2260 770`). `render.mjs` now takes `[out.png] [page.html] [w] [h]`.
- Known weakness added: jaw is not lowered, only the mouth opens; brows only mildly worried; the three steps share one trapezoid shape.

Known weaknesses: the bust on the black tee reads only as a silhouette; hair can read as two strips beside the neck in some views (rebuilt as one mass); the rest as in `kristina@1.0.1` (profile head, 3/4 sit, walk arm crossing, trouser merge, not run in the engine).

## 1.0.2 changes (hand fix, from 1.0.1)
- Hands: grip hand: 4 stacked bars on a block palm -> slim palm + 4 separate wrapped fingers + thumb. Flat skin shapes, one flat shadow shape (skin2), no strokes or gradients. Wrist pivot, length (~46 px), poses, mouth/eye anchors and every other part are unchanged; only `PF.hand` changed (the `grip` type; the relaxed hand already had separate fingers).
- 1.0.1 stays intact; scenes pin `friend@1.0.2` to get the new hands. Before/after: `golden/hands.png` shows this version only; compare with 1.0.1's golden.
