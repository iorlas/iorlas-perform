# video-art: rigs

A rig is a code module of cut-paper parts with pivots, expressions and poses, frozen as `video/rigs/<id>/<semver>/` (rules in the video skill, `contracts.md`). This file is about drawing one, judging one and extending one.

## Proportions and parts
- **Hands <= 1.3x the wrist width, separate fingers** (palm + 4 fingers + thumb for a gripping hand). "Fat hands" was rejected on sight; zoom 2x on every hand kind (`hand_kinds` in `rig.json`) before approving.
- Hip-to-floor about 43 % of height; legs and arms in proportion to the base: a female base must not inherit the male arm length ("not building a horse"). Head shorter rather than taller; check against a reference rig in the same sheet.
- Hair: `hair_back` (behind neck and shoulders) / skull (flat skin + one flat shadow shape) / `hair_front`; hair hugs the skull and sits behind the ears; **hair floating above the skull and wrong depth order were rejected twice**.
- Eyes small by default; larger only in panic. Face: no lines nobody asked for; no makeup unless the role needs it.
- Accessories (choker, glasses) use the body's neck and head dimensions; a choker clipping through the neck is a defect.
- No default prop in the hand. A prop only when the role or routine needs it (a mug, a notebook, a phone), as a `st.prop` with a hand and an anchor.
- Corner or angle glitches (jaw corners, offset edges) mean polygon joins: use rounded joins and test every variant.
- Every fill is flat; the only gradient allowed is the shared fade *mask*, never a colour fill.

## Expressions and mouths
- Minimum set per character: neutral, a signature default, smile, laugh, worry, panic, plus role expressions. Show the sheet with names.
- **Panic reads as panic only with:** larger eyes with visible whites, a flat open mouth (not a smile shape), worried brows, sweat; check the lower lid. Panic that reads as laughing was rejected for several rigs.
- **Mouth system:** four openness states (closed, small, mid, wide) scaled by `mouth_open` (0..1) driven by audio RMS. Wide enough to read: a narrow mouth "cringes", teeth sized to the mouth, big open shapes with a dark inside for shout/panic. Lip-sync owns the jaw: an expression never carries a mouth-open value.
- Expressions that must look different (proud vs clerk vs pretend) are shown side by side.

## Body and motion
- Side view and 3/4 show the body's curves; seated pose drawn as **one** thigh shape (tripled thighs were a defect); shading is one flat shadow, never layered soft shading ("looks 3D, our style is 2D").
- Walk: arms counter-swing the legs; check in profile and 3/4 (inverted arm swing was rejected).
- Shared bodies (one base for a female cast) are copied verbatim into each rig dir; a per-rig overlay is gated on its own id so siblings are untouched.

## Scale and role checks (before approving any rig or prop)
- Compare to a reference rig in the same image. A person 1.0, a standing desk 0.42, a monitor on it, a chair seat 0.25, a phone in a hand fits the palm.
- A look is the **role first**: an IT director must not read as military; a mother is a modern mother of her age, with warm eyes; a server is a recognisable old tower with a CRT. Brief role, age, feeling; then pick by number.

## Rig-gap list (fill in the design sheet for every cast member)
Seated at a table; seated facing a screen; slumped at a tower; hand on a rail; phone to the ear; holding a handset; arms raised / clap; walking; back view; 3/4 views matched to the partner rig (pairs that interact need a joint golden). Known workaround: standing behind furniture that hides the legs, plus a foreground framer. A missing pose is solved in the **design** first, in a rig version second.

## Adding a pose, expression or part
1. Copy `video/rigs/<id>/<old>/` to `<new>/` (patch = numbers, minor = additive, major = renamed/moved).
2. Edit art, `rig.json` (`poses`, `pose_keys`, `anchors`, `hand_kinds`), `RIG.md`, `known_weaknesses`.
3. `uv run video/rigs/verify.py --lock <new dir>` (refuses to overwrite a lock); render the golden (face/rig alone, then the pose sheet).
4. Review one image at a time (review.md); only then pin `id@new` in the design sheet. Old scenarios keep the old version.
5. Commit the rig alone; the lessons ledger gets a line.
Never edit a released version. A dropped (unreleased) version stays dropped.
