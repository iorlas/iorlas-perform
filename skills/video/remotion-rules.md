# video: Remotion and frame rules

Each rule is a real flicker or glitch cause. Official reference: `remotion-dev/skills` (best-practices, captions); read it before writing new components.

1. **Motion only through the frame number.** `useCurrentFrame()` + `interpolate` / `spring`. No CSS `transition`, no CSS `animation`, no `setTimeout`, no `requestAnimationFrame` state: the renderer seeks frames, it does not play them. Violation shows as flicker or a jump at a scene's first frame.
2. **No `backdrop-filter: blur`.** It flickers in capture. Use a pre-blurred copy of the image.
3. **Integer pixel positions** for text and thin shapes; sub-pixel positions make edges shimmer between frames.
4. **Seeded random only** (a seed in the rig or scene). `Math.random()` makes two renders differ and kills the cache.
5. **Minimum text size:** 34 px at 1080x1920 (about 1.8 % of height), equivalent elsewhere. Background text is smaller only if it is tone-on-tone and never story-bearing.
6. **One plate component** centred with `line-height: 1`; check the Cyrillic baseline (descenders and the cap height differ from Latin and the plate looks off-centre).
7. **No text inside raster images** (generated or drawn). All text is code, so it can be edited and checked.
8. **No gradients as fills on cut-paper assets** (video-art). Shared mask fades are the one allowed gradient, never a fill.
9. **A persistent element is one element.** A label that lasts a scene is one component mounted for the scene's frames; re-entering per shot flickers (lesson 2026-11-05).
10. **`Sequence` per caption page**, with `@remotion/captions` `createTikTokStyleCaptions` (each word text needs its leading space); `combineTokensWithinMilliseconds` low = word-by-word, high = a phrase.
11. **Numbers do not roll through a range** on screen unless the roll is the joke; flip, don't count.
12. **Same engine, same params for every scene** of an episode; concat by copy is refused otherwise.
13. **Telemetry off** for any engine CLI (`DO_NOT_TRACK=1`); pin the engine version.
14. **Frame 0 and the last frame** of every scene are checked against the golden composition: black frames at cuts and a half-drawn first frame are the commonest defects.
