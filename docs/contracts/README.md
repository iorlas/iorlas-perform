# Data contracts

Plain JSON files with plain-Python validators (`scripts/*.py`), stdlib only. Universal data is in
`contracts/` at the repo root; everything about one world lives in that world's folder (the profile).
Delete a world and every script still runs for another one: tests prove it.

| contract | file | tool | doc |
|---|---|---|---|
| world.brief | `<world>/world.brief.json` | `world.py` | [world-brief.md](world-brief.md) |
| episode.spec | `<world>/episodes/NN-slug.spec.json` | `episode.py` | [episode-spec.md](episode-spec.md) |
| distinctness | the specs above, as the ledger | `distinct.py` | [distinctness.md](distinctness.md) |
| experiments | `<world>/experiments.json` | `experiments.py` | [experiments.md](experiments.md) |
| platform_rules | `<world>/platform_rules.json` | `policy.py` | [platform-rules.md](platform-rules.md) |

Universal data: `contracts/formats.json` (format profiles), `hooks.json` (hook patterns),
`structures.json` (structure templates), `seeds/` (starting hypotheses and platform rules, copied into a world
by `init`). A world adds its own formats or hooks in `<world>/formats.json`, `<world>/hooks.json`.

## Rules for every contract

- **OPEN.** A field nobody decided holds the string `"OPEN"`. Validators list OPEN fields (level `open`) and
  never fill one in. `--strict` turns OPEN into a failure.
- **Confidence.** `FACT` (platform text, quoted), `3P` (third party), `FOLK` (creator wisdom), `JUDGE` (our
  recommendation), `TESTED` (our own result), `OPEN`.
- **Levels.** `error` stops (exit 1), `warn` is printed, `open` is a decision still owed.
- **World-agnostic.** Mechanism, outcome, set, title-pattern and premise-key ids are free text a world chooses.
  Only formats, hook patterns, structure templates, beat names, metrics and experiment areas are enumerated.

## The flow

```
world.py new      world.brief.json        platforms, formats, audience, cadence, policy, metrics
episode.py new    NN-slug.spec.json       from a structure template; everything OPEN
   human/AI fills the spec: hook, premise, mechanism, outcome, set, cast, beats' `what`
episode.py distinct   spec vs the last N episodes     (before writing a line)
episode.py expand     word budgets + outline; --script writes a skeleton whose
                      <!-- beat: ID --> comments are the spec's beats 1:1
   write the script into the skeleton
scenario.py lint + episode.py check SPEC SCRIPT --timeline T --audio WAV
policy.py check   before publishing: OPEN platform rules, stale sources
experiments.py result   after Studio data: result, decision
```

Not covered here, left open: the skills (`skills/`) that tell the writer to run this flow are another session's
work; this branch changes only code, schemas, tests and these docs.
