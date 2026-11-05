# world-bootstrap: distinctness gate (originality / demonetisation guardrail)

Checked at **stage 3** (idea matrix: each of the top 3) and **stage 4** (the final script), logged at stage 8. It protects the channel's monetisation eligibility, which a policy flag can remove for the **whole channel**.

## What the platform says (source of truth, fetched 2026-11-05 from https://support.google.com/youtube/answer/1311392)
The policy was renamed from "repetitious" to **"inauthentic content"** on 2025-07-15.
- **Violating**: content that "looks like it's made with a template"; "similar or repetitive content with low educational value, commentary, narratives, or minimal variation across videos"; "templated storylines... characters put in the same situation over and over again with the same outcome"; "AI-generated content made with generic or unoriginal templates giving the impression of mass production".
- **Allowed**: "the substance of each video should be materially varied"; "a series following a set of characters across episodes" as long as "each video has a distinct storyline, focus, or concept"; recurring intros/outros are fine if the bulk differs; AI used "to visualize a unique character and narrative you invented" is fine; with templates or automated tools "the final product must still demonstrate your creative vision".
- **Not covered by that page (OPEN, not verified):** animation as such, synthetic voice as such. AI-content disclosure is a separate rule (check at stage 0 field 7).
- 3P (secondary sources): detection also looks at titles, thumbnails and descriptions.
Consequence: **one recurring cast and one set of rigs is fine; the risk is same-structure episodes.**

## The check (per episode; fail = do not proceed)
Compare the candidate with the **last N episodes** (N = 5, or all if fewer) from `distinctness.log`. Each row must **differ**:

| # | dimension | question | differs? |
|---|---|---|---|
| 1 | premise | the situation in one line: is it a new situation, not the same with other nouns? | |
| 2 | central joke mechanism | what produces the laugh (a literal reading, a status reversal, a callback, an escalation of a lie)? not the same mechanism as the last 2 episodes | |
| 3 | outcome | how it ends (who wins, what resets): not the same outcome as the last 2 | |
| 4 | main set | the place the most time is spent in | |
| 5 | title / cover pattern | the title formula and cover composition, not identical to the last 2 | |
| 6 | structure | beat sheet shape (hook type, where the twist falls, number of speakers) | |
At most **one** dimension may repeat (and then not the premise or the mechanism). Two or more repeats = rework the idea (stage 3) or the script (stage 4), or park it.
Record per episode in the ledger `distinctness.log`: `NN | date | premise | mechanism | outcome | set | title pattern | structure | repeated dims | verdict`.

## Tricks to avoid being flagged
- Vary titles, covers and descriptions: no fixed template string beyond the series number.
- Own scripts and own voice cast; never publish text generated without a human rewrite stop.
- Own art direction: new sets or props in a meaningful share of episodes, not recolours.
- Human review at stop points (A-H) and keep the evidence: design sheets, table-read objections, ledger lines, drafts, decisions. These show creative input.
- No batch-publishing near-identical videos; spacing per the brief's cadence.
- A licence manifest for music and SFX: source URL + licence per asset.
- Recurring intro/outro/corner mark are fine; keep the bulk of every video different.
- Do not scale output by template: if two episodes could swap their nouns, they are one episode.

## Not a loophole
A passing check does not prove compliance; policy enforcement is the platform's. Re-check the policy page before each new world brief (`platform-research`).
