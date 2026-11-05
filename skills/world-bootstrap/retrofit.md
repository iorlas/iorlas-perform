# world-bootstrap: retro-fit an existing world

A world made before this workflow lacks the early decisions. Bring it up to standard **without inventing answers**.

1. Read the world's profile dir and any design docs. For each brief field (`brief-template.md`) and each stage output (`stages.md`), mark **PRESENT** (quote where), **PARTIAL** (what is missing) or **MISSING**.
2. Write `<world>/retrofit.md`: one row per field, with the evidence (file and line) or `OPEN for Denis: <the question>`. Never fill a MISSING row yourself; a guess here becomes a hidden assumption again.
3. Ask Denis the OPEN rows in priority order: platform and format first (they change everything), then audience, success, cadence, policy; style and brand last.
4. After the brief is approved, check the existing episodes against it: what must change (length, hook, intro, subtitles, canvas), what is kept. Do not re-script finished canon; mark episodes **audio-era** and decide per episode whether a video or Short is cut from it.
5. Run the **distinctness check** on the existing episodes and start `distinctness.log` from them, so the next ideas are compared against reality.
6. Fill stage 1 (style bible) from what already exists (approved sets, rigs, brand kit): write it down, do not redraw.
7. Update the world's docs; mark the retrofit date in `profile.md`.
The worked example for the first world is in the repo: `docs/retrofit/senior-vadik.md` (world-specific, so not in the skill).
