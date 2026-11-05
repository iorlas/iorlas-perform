# experiments

Tests of hypotheses ([hypotheses.md](hypotheses.md)) on our own uploads: `PROPOSED -> RUNNING -> COMPLETED`.
`<world>/experiments.json`, tool `scripts/experiments.py`.

```
experiments.py init WORLD                 copy the seed (16 experiments, all PROPOSED, no results)
experiments.py list WORLD [--all] [--status S]
experiments.py show WORLD ID              the record and the episodes that reference it
experiments.py add WORLD ID --hypotheses H[,H] --plan T --metric M[,M]
experiments.py start WORLD ID [--date D]
experiments.py result WORLD ID --n N --value T --decision adopt|reject|inconclusive [--note T] [--date D]
experiments.py check WORLD
```

| field | meaning |
|---|---|
| `id` | referenced from `episode.spec` `experiments` |
| `hypotheses` | ids in `hypotheses.json` this tests |
| `status` | `PROPOSED`, `RUNNING`, `COMPLETED` |
| `design` | how to test it with our own uploads (alternate variants across different sketches; never re-upload one) |
| `metric` | one or more of the metric ids in [world-brief.md](world-brief.md) |
| `started`, `completed` | dates |
| `result` | `null` until COMPLETED; then `{n, value, note, date}`; `n` is the number of videos |
| `decision` | `OPEN`, then `adopt` (the variant won: the hypothesis is confirmed), `reject`, or `inconclusive` |

Recording a result needs `--n` and `--value`; the tool computes nothing. COMPLETED with `adopt` or `reject` is written to
the linked hypotheses as `OWN` evidence and the lifecycle rule runs (`result` prints the moves); `inconclusive` changes
nothing. A result is never overwritten by the tool. The validator refuses COMPLETED without a result, a result on an
unfinished experiment, and an unknown hypothesis id.

Seed sources: `research/shorts_hooks.md` and `research/kylo_workflow_digest.md`: hook voice by 0.5 s, standalone line, reverse
open, no intro, end sting, karaoke subtitles, subtitle band, cover, 55 s vs 180 s, loop seam, mid re-hook, CTA, numbered
title, own viewed-vs-swiped baseline, RU feed, repetition tolerance. Experiment `exp-X` tests hypothesis `X`.

## Example

```json
{"id": "exp-intro-none-shorts", "hypotheses": ["intro-none-shorts"], "status": "PROPOSED",
 "design": "A/B on two uploads: no intro vs 2 s card; compare viewed-vs-swiped.",
 "metric": ["viewed_vs_swiped", "retention_3s"], "started": null, "result": null, "decision": "OPEN", "completed": null}
```

After `result ... --n 6 --value "78% vs 71%" --decision adopt` it holds `"status": "COMPLETED"`,
`"result": {"n": 6, "value": "78% vs 71%", "note": "", "date": "2026-12-01"}`, `"decision": "adopt"`.
