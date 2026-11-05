# experiments

Hypotheses about platform behaviour and format, tracked until tested. `<world>/experiments.json`, tool `scripts/experiments.py`.

```
experiments.py init WORLD                 copy the seed (16 hypotheses, no results)
experiments.py list WORLD [--all] [--area A]
experiments.py show WORLD ID              the record and the episodes that reference it
experiments.py add WORLD ID --area A --claim T --plan T --metric M[,M] [--confidence C] [--source T]
experiments.py result WORLD ID --n N --value T --decision adopt|reject|inconclusive [--note T] [--date D]
experiments.py check WORLD
```

| field | meaning |
|---|---|
| `id` | referenced from `episode.spec` `experiments` |
| `area` | `hook intro subtitles cover length cta title metrics audience policy audio other` |
| `claim` | the hypothesis, one sentence |
| `confidence` | `FACT` `3P` `FOLK` `TESTED` (our own result). Seeds are FOLK or 3P |
| `source` | `{doc, url?, note?}` where the claim came from |
| `test_plan` | how to test it with our own uploads |
| `metric` | one or more of the metric ids in [world-brief.md](world-brief.md) |
| `result` | `null` until tested; then `{n, value, note, date}`; `n` is the number of videos |
| `decision` | `OPEN` until a result; then `adopt`, `reject` or `inconclusive` |
| `decided` | date |

Recording a result needs `--n` and `--value`; the tool computes nothing. `adopt`/`reject` make the confidence `TESTED`;
`inconclusive` leaves it. A result is never overwritten by the tool. The validator refuses a decision without a result
and `TESTED` without one.

Seed sources: `research/shorts_hooks.md` and `research/kylo_workflow_digest.md` (hook voice by 0.5 s, standalone line,
reverse open, no intro, end sting, karaoke subtitles, subtitle band, cover, 55 s vs 180 s, loop seam, mid re-hook, CTA,
numbered title, own viewed-vs-swiped baseline, RU feed, repetition tolerance).

## Example

```json
{
  "id": "intro-none-shorts", "area": "intro",
  "claim": "A Short with no intro screen and at most a 0.5 s sting at the end retains better than one with a 1-3 s title card.",
  "confidence": "FOLK", "source": {"doc": "research/shorts_hooks.md section 7", "note": "no study found"},
  "test_plan": "A/B on two uploads: no intro vs 2 s card; compare viewed-vs-swiped.",
  "metric": ["viewed_vs_swiped", "retention_3s"],
  "result": null, "decision": "OPEN", "decided": null
}
```

After `result ... --n 6 --value "78% vs 71%" --decision adopt` the record has
`"result": {"n": 6, "value": "78% vs 71%", "note": "", "date": "2026-12-01"}`, `"decision": "adopt"`, `"confidence": "TESTED"`.
