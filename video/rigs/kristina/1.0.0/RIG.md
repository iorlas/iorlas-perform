# kristina 1.0.0 - female cut-paper rig

Working name (may change): the appealing woman, Vadik's age group, 20-25. Cast sheet12 variant 4: round slim face, bright blue eyes, freckles, dark half-bun with gold clip, sage knit sweater, dark trousers, white sneakers. Ridiculousness dial 2. Flat filled paper shapes, soft drop shadow per whole part (`look: cutout`).

- Machine-readable spec: `rig.json`. Art: `art/female_cut.js` (cast art + layers r22/r23/r24), seed 15, pure function of (state, t). Registers: `HF.RIGS.kristina`, `HF.RIG.kristina`, `HF.EXPR_F.kristina`, `HF.POSES_F`, `HF.CHARS.kristina`. `walk` via `HF.walkPose(phase 0..1)` (8 frames).
- The module also registers `friend`; the same file is copied verbatim into `friend/1.0.0` so each version hash stays self-contained.
- Body: `body_type: f`, height 0.945 of vadik, waist ~56% of hip, rear 16.5 px behind the back line, bust option D (silhouette only; front +14% over shoulders, profile apex +19 px at y=82). Face contour is one G1 egg curve.
- Shading: flat base + ONE flat shadow shape per part, light from the upper left, no gradients. Seated legs are exactly 4 shapes (2 thighs, 2 shins).
- Views: front, 3/4 (~30 deg), side, back; sit front and 3/4; stand, walk (8 frames, arms oppose legs facing right). Feet outward (-11 / +12 deg).
- Mouth: states closed 0 / small 0.3 / mid 0.6 / wide 1 on `st.mouth`; width x1.42, cupid's bow, thin upper teeth strip, lower teeth only at wide.
- Habit props: phone, mug (`st.prop {on, at, hand}`), default off.
- `golden/golden.png`: both women, all views and mouth states, four-leg check. Vadik is drawn for scale from `vadik/1.1.0`; re-render with `golden/render.mjs` (needs PUPPETEER_CORE and CHROME).

Known weaknesses: profile head is a simplified hand cut; 3/4 only to ~30 deg; near arm crosses the ribs in walk frames; 3/4 sit shows the far thigh only at the knee; seated dark trousers merge pelvis and thighs; head-to-body ratio eyeballed; not run through the real engine; draft status at freeze: rig_f 1.11 (checks pass, self-rated 7.5/10).
