---
name: video-art
description: Art rules for flat cut-paper puppets and sets: the look, set tiers A/B/C, style grammar and attention rules AR1-AR7, set census, hand and body proportions, one flat base plus one flat shadow, scale and relight checks, rig versions and the rig-gap list, the review process, and the anti-list of AI-template looks. Use before drawing or judging any rig, set, prop, card or overlay, for "design a set", "new character", "add a pose", "this looks wrong", or when planning places for a new scenario. Pipeline and render are the video skill.
---

# video-art

The look is **flat cut paper**: every part is a flat base plus one flat shadow shape; light is one direction; the paper is the style. Everything else (gradients, glow, 3D, glass) breaks it.

| file | holds |
|---|---|
| `grammar.md` | style grammar (11 rules), attention rules AR1-AR7, palettes by time of day, set tiers A/B/C, kit modules, relight rules |
| `census.md` | how to take a set census for a scenario; template; selection of anchors |
| `rigs.md` | rig proportions, hands, expressions, mouths, seated/rail/phone poses, scale checks, the rig-gap list, adding a pose as a new rig version |
| `review.md` | how art is reviewed (one image at a time), what Denis rejects, the anti-list of AI-template looks |
| `${CLAUDE_SKILL_DIR}/../video/lessons.md` | the dated ledger of every art defect and fix; read it first |

## The short list (check every image against it)
1. One floor plane; feet on one y; wall furniture on the wall-floor junction.
2. Each part: flat base + **one** flat shadow shape. No gradient fills, no thin stripes, no circles as decoration (rounded rectangles instead).
3. Hands <= 1.3x the wrist, separate fingers; look at them at 2x zoom every time.
4. Props sized from the person's height, not from pixels. A desk is about 42 % of a standing person.
5. At most 2-3 story props per set; each unmistakable at thumbnail size and cited by a line.
6. Background text small and tone-on-tone; story text large enough to read once; no text in raster art; no text on rig stickers.
7. Every shot has one focus (AR1); the subject has the highest contrast and saturation (AR4).
8. Rigs hide gaps behind `mid_front` furniture; if a pose does not exist, design around it or make a new rig version.
9. Light is a palette swap plus one flat glow shape per source; do not fake night with a CSS filter on rigs when the shot is a close-up (rim light shapes exist).
10. No default prop in a character's hand; a prop only when the role or the routine needs it.
11. Never repaint an approved image in place: new version, side by side with the old one.
