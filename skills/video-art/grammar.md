# video-art: style grammar

Source: an approved anchor set, two sibling sets and the owner's feedback, formalised in a set census (2026-11). Numbers like "AR1" are cited from design sheets and reviews.

## Tiers
| tier | what | when |
|---|---|---|
| **A** | hand-designed anchor, its own unique prop and wall joke, day/night pair if it recurs | places that recur and carry a story prop |
| **B** | assembled from the kit modules | vehicles, exteriors, generic rooms |
| **C** | one-off generated from the grammar (+ kit) by someone who did not design the anchors | places that appear once (also a test: if it matches, the grammar works; if not, the grammar needs rules) |
Counts for a 5-scene scenario: A 3, B 1, C 1 is normal.

## Eleven rules
1. **One floor plane.** Everything stands on one `floor_y`; a wall-floor junction line; actors' feet on one y.
2. **Depth layers**, same order for every set: `bg` (wall, floor, window, decor) -> `mid` (furniture behind the cast) -> `cast` (actor slots) -> `mid_front` (tables, counters that hide rig gaps) -> `fg` (a framer: plant, chair back, doorframe, vehicle rail; parallax 1.15).
3. **Each part = flat base + ONE flat shadow.** No gradients, no thin stripes, no circles as decoration (a clock or lampshade is a rounded square or flat trapezoid).
4. **Story props few and sharp** (2-3), readable at thumbnail size; **background text small and tone-on-tone**.
5. **Unmistakable objects.** A server looks like a server, a minibus like a minibus. Never an abstract shape that needs a caption; never an ambiguous sticker (a blank sticker is cut).
6. **Rigs hide behind `mid_front`.** Only the poses that exist are used; seated needs a table in front.
7. **Re-lightable:** same object list, palette swap per time of day, one flat glow per source, one light direction per set.
8. **Palette per time of day** (named slots `wall`, `floor`, `glow` + three accents). Day: warm peach/cream or grey-green office. Overcast/rain: desaturate wall and floor 25 %, flat dark diagonal slabs on glass only (never thin lines). Evening: warm orange glow shape, longer floor shadow. Night: navy wall, darker floor, lit window squares, one LED, one cool screen-glow shape; rigs go darker through a colour matrix plus a rim-light shape (define every filter id the set references).
9. **One accent per set:** a saturated block the eye finds first.
10. **Text on walls = identity:** each set carries one joke the room can tell without a character (a job ad, a sprint board, a schedule that says do not edit). Plan one per set.
11. **Crowds are silhouettes**, two depths, no faces, one foreground figure may have a joke.

## Attention rules (AR1-AR7)
- **AR1** one subject per frame, named in the shot list as `focus`.
- **AR2** crop to the subject: close or medium for dialogue; wide only to establish.
- **AR3** no big non-subject object in the middle (a table steals attention): push it to an edge, crop it or tone it down.
- **AR4** the subject has the highest contrast and saturation; the background is calmer; a story prop is loud only when a line points at it.
- **AR5** the subject stands on a third line and looks toward open space.
- **AR6** an inset is smaller than the subject, on the side opposite the subject's look, never over a face.
- **AR7** across a cut the next subject lands near the same screen position, or the jump is deliberate (a fixed third per character through a whole episode).

Every set needs: a calm tone-on-tone layer, a clear left and right third with open space beside the usual subject, and a table or counter that can be cropped or desaturated.

## Kit modules (for tier B and C)
Room shells (office-flat, kitchen-flat, windowless, glass wall) - windows (single, double, vehicle with rain, curtain wall, each with a sky slot: day, evening, night, rain) - doors - light sources (window glow, fluorescent pool, lamp pool, LED dot: one translucent shape + one floor patch) - furniture (tables, chairs with rig-friendly backs, shelves, crate stacks, cabinets, counters) - transport interior (rail, seat row, window band, tone-on-tone fare sign) - crowd (6-8 silhouettes, 2 depths, variants) - exterior (ground plane, stall, lamp post, one flat skyline strip, kiosk) - weather/sky layer - story props (max 2-3 per shot) - background props (tone-on-tone) - UI modules (wall display in states, phone insert, résumé-style table) - foreground framers.

## Overlays and inserts
UI modules are overlays, not sets (video contracts). Fixed position and size per scene; the current item loud, earlier items tone-on-tone above it; a flashback marker is ONE constant overlay (palette desaturated by about 25 % + a cut-paper strip with torn edge) that peels off at the scene end.

## Known risks seen in practice
- A rig has no seated pose and no pose facing a screen: use standing + framer, or request a new rig version.
- Cyrillic on rig stickers renders garbled: draw text in the set or an overlay.
- Night through a CSS filter on rigs is not a real re-light: allowed for wide shots, check close-ups.
- A drawn set in two lights keeps one svg per variant per object; `lit` objects bypass the night filter.
