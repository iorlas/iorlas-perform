# friend 1.0.0 - female cut-paper rig

Подруга, Vadik-side friend, slightly gothic. Cast sheet18 variant 3: egg skull width 76, lob as one hair mass with the tucked side and one ear open, dark heavy-lidded eyes with a cold "I hate the world" stare, plum lips, choker with round pendant, black tee with small XX, loose dark trousers, black ankle boots. Ridiculousness dial 4. Flat filled paper shapes, soft drop shadow per whole part (`look: cutout`).

- Machine-readable spec: `rig.json`. Art: `art/female_cut.js`, seed 21, pure function of (state, t). Registers: `HF.RIGS.friend`, `HF.RIG.friend`, `HF.EXPR_F.friend`, `HF.POSES_F`, `HF.CHARS.friend`. `walk` via `HF.walkPose(phase 0..1)` (8 frames).
- The module also registers `kristina`; the same file is copied verbatim into `kristina/1.0.0` so each version hash stays self-contained.
- Body: `body_type: f`, height ~0.93 of vadik, waist ~57% of hip, bust option D (silhouette only; front +11% over shoulders, profile apex +12 px at y=82). Face contour is one G1 egg curve.
- Extra parts vs kristina: `choker`, `pendant`. Wide-mouth state +30%.
- Shading, views, walk, sit, feet, mouth states and props: same system as `kristina@1.0.0`.
- `golden/golden.png`: shared sheet with both women (see kristina RIG.md); re-render with `golden/render.mjs`.

Known weaknesses: the bust on the black tee reads only as a silhouette; hair can read as two strips beside the neck in some views (rebuilt as one mass); the rest as in `kristina@1.0.0` (profile head, 3/4 sit, walk arm crossing, trouser merge, not run in the engine).
