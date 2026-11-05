# video-art: set census method

Do this per scenario, after the script is final and before any art. Output: `<scenario>.census.md` next to the design sheet.

1. **List places** in script order: one row per distinct place, not per scene (a place that returns is one row).
2. **For each**: id, scenes, **recurs in the series** (very high / high / medium / low), **tier** (A hand-designed anchor, B kit, C one-off), **time of day and light** (the re-light plan), status (exists / needs design).
3. **Shots by scene with focus** (AR1): per shot a one-line frame, the focus, the side of the frame; check AR7 across cuts.
4. **Screen-in-screen and insets**: list UI modules with their states.
5. **Kit modules needed** for the B and C tiers (the 13 groups in `grammar.md`), and which already exist.
6. **Risks and holes**: a set that exists but is the wrong kind of room (an office reused where the story needs a closed room), a vehicle with a rig on a rail, a place that needs a pose no rig has.
7. **Recommendation, anchors to design first.** Each next anchor should teach the kit a new dimension, so later sets follow one theme. Example order: (1) a place whose point is re-lighting (day and night pair); (2) the first non-room set (forces crowd, window band, rail framer, standing-pose rule); (3) a windowless set with a reusable unique prop; (4) the first outdoor floor plane and sky; (5) a tier-C test built only from the grammar.
8. **Spare places** from cut drafts are listed, not designed.

Template:
```
| id | scenes | recurs | tier | time / light | status |
## Shots by scene with focus
| scene | shots: n focus; framing; side |
## Overlay modules
## Kit modules needed
## Risks / holes
## Recommended anchors (order)
```
