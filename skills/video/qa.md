# video: QA checklist

Run before showing any render. Tick or fix each; report the ones that stay open by shot id. 1-13 are the 13 defect classes from the Kylo workflow digest (an outside creator's list, merged); P1-P14 are ours, each from a real review.

## From the outside list (1-13)
1. Black or empty frames at cuts and at the first/last frame of a scene.
2. Objects intersecting each other (a hand through a prop, a prop through a wall).
3. Anything clipped by the frame edge that should be whole (a subject, a card, a sign).
4. Text off-centre in its plate, or the Cyrillic baseline wrong.
5. Subtitle overlapping another element, or two phrases at once.
6. A static frame longer than 3 s (Shorts: 1.5-3 s per change) with nothing moving: add a push-in, a cue, a screen state, or cut.
7. Each spoken noun that matters is on screen within +-0.3 s of being said.
8. Numbers roll through a range instead of showing the result.
9. The same transition twice in a row; a "lights out" more than 3 times.
10. A whoosh on every cut; constant zoom pulse; everything sliding up at once.
11. The hero looks different in different scenes (wrong rig or version).
12. Letters inside a picture (garbled Cyrillic on a sticker).
13. Audio: a peak above -1 dBTP, a voice jump of more than 3 dB between turns, a pause over the target.

## Ours (P1-P14)
P1. **Mouth moves** for every speaker in frame in every shot, including whispers after a shout (the test: non-empty mouth track).
P2. **A persistent label does not flicker** (one overlay for the scene).
P3. **Zoom makes sense:** the subjects of the line are all in frame; no close-up with two subjects; not zoomed past 1.6x with several subjects.
P4. **Right rig for the character:** `id@semver` equals the sheet; compare the first frame to the rig golden.
P5. **No stand-in:** nobody looks "generic".
P6. **Poses exist:** seated, rail, phone-to-ear, facing a screen: if the rig has none, the design says what hides it (table, framer), and the shot shows only that.
P7. **Hands:** wrist-to-hand ratio <= 1.3x, fingers separate; zoom on every close-up.
P8. **Edge glitch:** no corner or offset edge poking out of a frame, inset or phone (a bottom corner slipping past a rounded frame; an angle on a jaw).
P9. **Scale:** a person, a desk, a computer, a phone are in proportion (prop height vs actor from the stage `H`; a desk is about 42 % of a standing person, a hip is above its top).
P10. **Standing on the floor:** feet on `floor_y`, not on a desk front or a plinth; furniture on the junction line.
P11. **Attention:** one named focus; no big non-subject object in the middle; overlay smaller than the subject, on the opposite side, not over a face.
P12. **Same position across a cut** (AR7): the next subject lands where the last one was, or the jump is deliberate.
P13. **Text reads once:** story text large enough to read in the shot's length; background texts tone-on-tone; no debug labels; no label that names something the story does not (a role the character does not have).
P14. **Reaction exists:** a character addressed or insulted reacts, even silently (table read catches it in the script; the video must show it).
Also: embedded scenes (call, flashback, chat) have their own composition; a time card is centred; the end card's text is the series title.

## Output
Contact sheet (1 frame per second), the list of failures with shot id and time, and for each: fix applied / open. Add every new class to `lessons.md`.
