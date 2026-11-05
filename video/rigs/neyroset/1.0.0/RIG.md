# neyroset 1.0.0 - Нейросеть asset set, cut-paper «Вырезка»

Female AI-assistant character as three display modes + a smiley with 12 expressions. Flat smooth-edged paper layers, one flat shade shape per part, soft drop shadows between layers only, no gradients, dusk-blue palette, grain only on the sheet. Machine-readable spec: `rig.json`.

- Art: `art/neyroset_cut.js`, self-contained (no `HF` needed). `NEY.draw(state, t)` returns an SVG string; `NEY.defs()` returns the two shadow filters, insert once per page. Pure function of (state, t): blink (every 3.4 s) and idle bob derive from `t`.
- Hair: the navy cap-with-parting-and-fringe from cast cell «Нейросеть б» (client OK), redrawn flat (original used a gradient face and circles). The parting is the gap between two fringe pieces, readable at 64 px.

## Modes (`state.mode`)
- `chat_window` 520x440: title bar (3 square buttons, avatar), message area, composer. `chat_lines[]` = `{from:'user'|'ai', text, expr?, emoji?, react?:[{e,n}]}`; text wraps to 5 lines at 300 px (canvas `measureText`, 0.56 em fallback), ellipsis after. AI lines get an avatar with `expr`. `typing:true` adds the typing-indicator bubble (dots bounce by `t`). Newest message sticks to the bottom; overflow is clipped by the message area with a scrollbar; `scroll` 0 (newest) .. 1 (oldest).
- `monitor_smiley` 520x380: monitor frame (`frame:false` = bare screen content at (30,24) 460x264), smiley, one `phrase` line (ellipsised to the screen), optional `emoji` sticker.
- `thought_cloud` 400x360: cloud + three tail bubbles toward bottom-left (tail tip (38,334) is the anchor over a head), smiley, optional `phrase` and `emoji`.
- `head` (centre origin, box `NEY.HEAD_BOX`), `head_back` (clean back view, optional `bust`).

## Expressions (12)
panicked is a small dark open oval, corners down, wide eyes, raised worried brows, sweat drops: no teeth, no tongue, so it never reads as laughing.
neutral_helpful, thinking, confident_wrong, apologetic, cheerful, typing, error, hallucinating, smug, sleepy, sarcastic, panicked. Parameters per expression: eyes (open / arc / x, lid cover, gaze, scale), brows, mouth (width, curve, smirk, base open, thin teeth strip, tongue), cheek size, head tilt, dy, fx (sweat, dots, check, warn, zzz, sparks, glitch, typing).
`mouth_open` 0 / 0.3 / 0.6 / 1 (`NEY.VISEMES`) adds to the expression's base open: interior from >0.12, thin teeth crescent from 0.25 (if the expression has `mt` or open >= 0.55), tongue from 0.55 (if `mg` or open > 0.9); expressions with `nt:1` (panicked) never show teeth or tongue. Works on every expression, including the zigzag (error) and wavy (hallucinating) mouths.

## Emoji
Nine flat paper icons (`NEY.EMOJI`): heart, star, fire, check, cross, laugh, sparkle, bulb, question. No system emoji font, so it renders the same everywhere.

## Golden
`golden/golden.png` (2400x1800) is built by `golden/render.mjs` from `golden/golden.html`: three modes, 12 expressions, 4 mouth states, 64/40 px working-size insets, mode insets at 0.3-0.46 x, a scrolled chat, back view, palette, emoji. Layout is part of the golden.

## Known weaknesses
- Font is Marker Felt (macOS). On other machines text falls back to Helvetica/sans-serif, widths change and wrapping with it.
- At 64 px thinking / typing / neutral_helpful differ mainly by fx marks and gaze; sleepy, error, cheerful, panicked read on the face alone. At 40 px without fx several look alike.
- Back view is a plain rounded helmet shape; no 3/4 view; no body below the bust.
- Mini-figure in the cloud is the bust only (`bust:true` on `head`; the modes draw the head without bust).
- Eyes keep a white sclera: tiny eyes on a 24 px head become two dots.
- Thought-cloud bumps are ellipses by necessity of the shape; the tail bubbles are ellipses too.
- Chat text slot is for short lines: 5 lines per bubble maximum, no markdown, no inline images.
