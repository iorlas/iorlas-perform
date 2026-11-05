# hypotheses

A living list of claims about platform behaviour and format, each with dated evidence and a lifecycle. Plain JSON in the
world folder (`<world>/hypotheses.json`, `<world>/sources.json`), tool `scripts/hypotheses.py`. It follows Denis's a2kay
research R037 (`research/youtube-algorithm-research-optimization`): the same statuses, the same source-bias principle. The
repo stays universal and a2kay-optional: nothing here needs the a2kay MCP; [refresh](#refresh) names where a sync fits.

## Fields

| field | meaning |
|---|---|
| `id` | referenced by experiments (`hypotheses[]`) |
| `claim`, `area` | one sentence; `hook intro subtitles cover length cta title metrics audience policy audio other` |
| `status` | `ACTIVE SUPPORTED VALIDATED CONTRADICTED INVALIDATED` |
| `confidence` | `low` `medium` `high`: strength of the evidence, not of one source |
| `source_bias` | list of `STRATEGIC` (the platform's own statements: credible but strategically biased, weigh least), `3P` (independent third party), `FOLK` (belief without a source), `FACT` (a primary page read), `OWN` (our own data, weighs most) |
| `evidence[]` | `{date, stance for/against, attribution, url, bias, note, strong}`; never removed |
| `experiments[]` | ids in `experiments.json` that test it |
| `refs` | optional pointers outward, e.g. `{"a2kay": "assessment/1012"}` |
| `origin` | where the claim came from; not evidence |
| `history[]` | every status move: `{date, from, to, why}` |

## Lifecycle

```
ACTIVE -> SUPPORTED -> VALIDATED
ACTIVE | SUPPORTED | VALIDATED -> CONTRADICTED -> INVALIDATED
```

`hypotheses.py promote WORLD ID|--all [--dry-run]` applies the rule; nothing moves by hand except `demote`.

| move | rule |
|---|---|
| ACTIVE -> SUPPORTED | 3 or more `for` points with distinct attributions, at least one not STRATEGIC; or one of our experiments confirmed it |
| SUPPORTED -> VALIDATED | a linked experiment is COMPLETED with decision `adopt` |
| -> CONTRADICTED | a `strong` `against` point; or 2 or more `against` attributions and more than `for`; or a linked experiment COMPLETED with `reject` |
| CONTRADICTED -> INVALIDATED | a linked experiment COMPLETED with `reject` when the contradiction came from evidence; a second rejecting experiment when the first one caused it |
| `demote --to S --reason T` | one step back (SUPPORTED to ACTIVE, VALIDATED to SUPPORTED, CONTRADICTED to ACTIVE, INVALIDATED to CONTRADICTED) with a reason |

The same source counts once however many posts it has. STRATEGIC points count but cannot support a claim alone. Independent
data that contradicts the platform's statement is the point of the bias tag, so it needs no extra weight in the rule: only
the STRATEGIC point is held back.

An experiment's result is written back as `OWN` evidence automatically (`experiments.py result`) and the rule runs; see
[experiments.md](experiments.md).

## Commands

```
hypotheses.py init WORLD                       seed: 16 hypotheses (all ACTIVE, no evidence) and sources.json
hypotheses.py list WORLD [--status S] [--area A]
hypotheses.py add WORLD ID --claim T --area A [--confidence C] [--bias B,B]
hypotheses.py add-evidence WORLD ID --stance for|against --attribution WHO --date D [--url U] [--bias B] [--note T] [--strong]
hypotheses.py promote WORLD ID|--all [--dry-run]       demote WORLD ID --to S --reason T
hypotheses.py export WORLD [--out FILE]        import WORLD FILE.md
hypotheses.py refresh WORLD                    scanned WORLD SOURCE_ID
```

## export / import

`export` writes a flat markdown table, `| id | claim | confidence | source-bias | status | a2kay ref | tests |`, the shape of
`ru-voice-clone/research/hypotheses_export.md`. `import` reads such a table and adds rows whose id is new (existing ids are
kept, so it is safe to repeat). Status words map: open and contested to ACTIVE (contested is noted), supported to SUPPORTED;
`STRATEGIC (FACT text)` becomes `["STRATEGIC","FACT"]`; the a2kay ref and test refs go to `refs`. Evidence entries live only in
`hypotheses.json`; a2kay is the other store, and which wins on conflict is left to the person syncing.

## refresh

`sources.json` is the list of what to scan, as data:

| field | meaning |
|---|---|
| `id`, `name`, `kind` | `official`, `press`, `community`, `own-data`, `channel` ... |
| `url`, `bias` | where; a source-bias tag |
| `how_to_scan` | what to do on a scan, in words |
| `cadence_days`, `last_scanned` | `refresh` lists a source as DUE when never scanned or older than the cadence |
| `feeds` | the areas its claims land in |

`steps` is the ordered checklist (list due sources, scan, attach evidence, re-evaluate, mark scanned, update platform rules,
optionally sync with a2kay when the MCP is available). Seed sources are only those the research names (two YouTube Help pages,
trade press, own Studio); the communities list is the world's to fill in. Example row:

```json
{"id": "yt-policy-page", "name": "YouTube monetization policies (inauthentic / repetitive content)", "kind": "official",
 "url": "https://support.google.com/youtube/answer/1311392", "bias": "STRATEGIC", "cadence_days": 30, "last_scanned": "2026-11-05",
 "how_to_scan": "Fetch the page; diff the 'Generic or Repetitive Content' section against platform_rules.json quotes; update `fetched`; open any new wording as a rule.",
 "feeds": ["policy"]}
```

## Example

```json
{"id": "intro-none-shorts", "area": "intro", "status": "ACTIVE", "confidence": "low", "source_bias": ["FOLK"],
 "claim": "A Short with no intro screen and at most a 0.5 s sting at the end retains better than one with a 1-3 s title card.",
 "origin": {"doc": "research/shorts_hooks.md section 7", "note": "no study found"},
 "evidence": [], "experiments": ["exp-intro-none-shorts"], "refs": {}, "history": []}
```

After `experiments.py result ... exp-intro-none-shorts --n 6 --value "78% vs 71%" --decision adopt` it holds one `OWN`
evidence entry and a `history` of ACTIVE to SUPPORTED to VALIDATED.
