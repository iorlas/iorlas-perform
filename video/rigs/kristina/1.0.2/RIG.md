# kristina 1.0.2 - female cut-paper rig

Working name (may change): the appealing woman, Vadik's age group, 20-25. Cast sheet12 variant 4: round slim face, bright blue eyes, freckles, dark half-bun with gold clip, sage knit sweater, dark trousers, white sneakers. Ridiculousness dial 2. Flat filled paper shapes, soft drop shadow per whole part (`look: cutout`).

- Machine-readable spec: `rig.json`. Art: `art/female_cut.js` (cast art + layers r22/r23/r24), seed 15, pure function of (state, t). Registers: `HF.RIGS.kristina`, `HF.RIG.kristina`, `HF.EXPR_F.kristina`, `HF.POSES_F`, `HF.CHARS.kristina`. `walk` via `HF.walkPose(phase 0..1)` (8 frames).
- The module also registers `friend`; the same file is copied verbatim into `friend/1.0.1` so each version hash stays self-contained.
- Body: `body_type: f`, height 0.945 of vadik, waist ~56% of hip, rear 16.5 px behind the back line, bust option D (silhouette only; front +14% over shoulders, profile apex +19 px at y=82). Face contour is one G1 egg curve.
- Shading: flat base + ONE flat shadow shape per part, light from the upper left, no gradients. Seated legs are exactly 4 shapes (2 thighs, 2 shins).
- Views: front, 3/4 (~30 deg), side, back; sit front and 3/4; stand, walk (8 frames, arms oppose legs facing right). Feet outward (-11 / +12 deg).
- Mouth: states closed 0 / small 0.3 / mid 0.6 / wide 1 on `st.mouth`; width x1.42, cupid's bow, thin upper teeth strip, lower teeth only at wide.
- Habit props: phone, mug (`st.prop {on, at, hand}`), default off.
- `golden/golden.png`: both women, all views and mouth states, four-leg check. Vadik is drawn for scale from `vadik/1.1.0`; re-render with `golden/render.mjs` (needs PUPPETEER_CORE and CHROME).

## Changes vs 1.0.0 (patch: expression numbers; shared module gained additive channels)
- `panic` reworked so it no longer reads as a laugh: eyes larger (`open` 2.6, `lo` 3, `pup` .4), brows high with the inner ends up (`by` 9, `btL/btR` 7), open oval mouth with corners down (`mc` -1.1, `mw` 1, `mo` .62), no teeth or tongue (`mt`/`mg` 0), sweat drop kept. The old lip shape is still used, so the peaked upper lip remains visible.
- The shared module `art/female_cut.js` also carries friend's new channels (`trap`, `lt`, `pale`, `irs`, second sweat drop); kristina does not use them and every other expression renders as in 1.0.0. No `panic_soft`/`panic_hard` here (friend only).
- `golden/golden.png` re-rendered (both women, unchanged layout); `golden/golden_panic.png` shows neutral, laughing, surprised and panic at 2x and working size (`node render.mjs golden_panic.png golden_panic.html 1810 770`). `render.mjs` now takes `[out.png] [page.html] [w] [h]`.
- Known weakness added: panic still uses the old lip shape (peaked upper lip), jaw not lowered.

Known weaknesses: profile head is a simplified hand cut; 3/4 only to ~30 deg; near arm crosses the ribs in walk frames; 3/4 sit shows the far thigh only at the knee; seated dark trousers merge pelvis and thighs; head-to-body ratio eyeballed; not run through the real engine; draft status at freeze: rig_f 1.11 (checks pass, self-rated 7.5/10).

## 1.0.2 changes (hand fix, from 1.0.1)
- Hands: grip hand: 4 stacked bars on a block palm -> slim palm + 4 separate wrapped fingers + thumb. Flat skin shapes, one flat shadow shape (skin2), no strokes or gradients. Wrist pivot, length (~46 px), poses, mouth/eye anchors and every other part are unchanged; only `PF.hand` changed (the `grip` type; the relaxed hand already had separate fingers).
- 1.0.1 stays intact; scenes pin `kristina@1.0.2` to get the new hands. Before/after: `golden/hands.png` shows this version only; compare with 1.0.1's golden.
