# mama 1.1.0 - cut-paper rig (neck + waist fix of 1.0.0)

Мама Вадика, ~46. Look: poc_cast24/cast_sheet22.png variant 2 (wavy lob, round thin glasses, yellow zip knit jacket, straight trousers, white sneakers, phone). Eyes: poc_cast25/eyes_mama.png cell 2 (hazel, iris x1.3, two catchlights, kind crease) as warm_default, brows of cell 5 for worried_mom, cell 4 (smiling lower lid) for proud_beam / tearful_happy / laugh.

Built on the frozen women rig (kristina 1.0.1 / friend 1.0.1, `art/female_base.js` = unchanged friend 1.0.1 module). `art/mama_overlay.js` (generated from `ov/*.js` by `python3 build.py`) is appended inside the module IIFE -> `art/female_cut.js`. All Mama code is gated on `isM(S)` / `ch.id==='mama'`; kristina/friend output is untouched.

- Head: redrawn flat in the rig head frame (own units, scale .68 about the eye line y=-45). Layers: hair_back (behind neck and shoulders, drawn before the torso), skull (flat skin + one flat shadow shape, ears, face), glasses (detachable, `st.glasses` 0|1, default 1), ear studs, hair_front (hair_side hugging the skull and tucked behind both ears + fringe, each with one flat shadow). Back view: PF.head_back draws the lob in front of neck and shoulders. Profile: own cap hair, tucked ear; the back hair mass is drawn by torso_side so it sits behind the neck.
- Face: small soft nose, subdued lips (no cupid bow), two light smile lines only, hazel eyes, no gradients.
- Body (0.3.0, rounder): hipY 246, UL 143 / LL 139 (hip-to-floor ~43% of height), torso longer (waistY 148, hem 258, curved over a soft belly, hemW 62), waist 50 / hip 61 (82%), arms x1.2 (sleeve 26.4/21.6, forearm 21.6/16.4), neck half-width 17.5, fuller straight trousers (knee 19, calf 19.6, ankle 16.5), sneakers / slippers via `st.shoes`. Profile: own round torso_side (bust, belly, full back), stronger chin + one flat double-chin shape. 3/4: glasses follow the turn (far lens narrower, far temple arm hidden). Back view: hair as back mass + two curtains + parting + wave shadows. Height ~0.91 of vadik (bbox 741 vs 814 px).
- Poses/walk: `RIGS.mama` adapts pose data on the fly (hand y offsets for the longer arms and torso; side poses with a gait get stride x0.8, hip bob x1.25, hip rot x1.5, counter-rotating shoulders, arm swing x0.8). Shared pose data untouched.
- Flat rule: every Mama fill is flat; the only gradient left is the shared pelvis fade MASK of the women rig (not a fill colour), plus the drop-shadow filters between parts.
- Expressions (11): warm_default, soft_smile, worried_mom, proud_beam, scolding, suspicious, tearful_happy (channel `tear`), laugh, panic (small flat oval mouth, corners down, wide eyes with white ring, sweat), disappointed, neutral. New channels `sq` (smile squint) and `cr` (eye crease). Mouth open 0 / .3 / .6 / 1.
- Poses (28 + walk_f0..7) and props (phone, mug, ladle, cup) as rig 0.1.0.
- Params: `st.glasses` 0|1 (default 1); `st.shoes` 'sneaker'|'slipper'; props via `st.prop {on:'phone'|'mug'|'ladle'|'cup', hand, at, rot}` (ladle with pose stir_hold, phone with phone_ear).
- Golden: `golden/golden.html` -> `node render.mjs golden.png golden.html 2400 1800` (needs PUPPETEER_CORE and CHROME env); vadik for scale loads from vadik/1.2.0.
Known weaknesses: see rig.json known_weaknesses.

Known weaknesses: loose jacket reads tube-like (belly visible only in profile); profile neck is two pieces; hand targets patched by a per-pose y offset in RIGS.mama; 3/4 glasses lightly checked; table/counter/pot are flat shapes, not parts; sit uses the women chair.


## 1.1.0 changes (from 1.0.0; 1.0.0 stays intact)
- Neck: `dim.neckY` -22 -> -17 (head sits 5 units lower, chin closer to the collar); neck stem half-width 17.5 -> 21 with a wider base flare, same single flat jaw shadow.
- Waist: `dim.ww` 50 -> 38, `bw` 50 -> 54, `rb` 46 -> 48, `hemW` 62 (unchanged): the jacket tapers at the waist and flares to the hem instead of reading as a tube. Pose data, pivots, props, expressions untouched.
- Not changed: hands (still the shared 1.0.0 hand, wider than 1.3x wrist). Slim fingered hands are a separate later version.
- Why: set A review (kitchen, Мама behind the island) showed a thin neck against a wide tube torso.
