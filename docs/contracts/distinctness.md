# Distinctness check

`distinct.py WORLD [SPEC] [--last N]` and `episode.py distinct SPEC`. Deterministic, no model. It compares the
five novelty keys of each episode with the **last N** earlier ones (the ledger = `<world>/episodes/*.spec.json`,
ordered by `number`; `status: dropped` is ignored). A key that is OPEN is never compared.

Guards against the written policy's «looks like it's made with a template», «the same situation over and over again with
the same outcome» and «minimal variation across videos» (see [platform-rules.md](platform-rules.md)).

| collision | level | default |
|---|---|---|
| same `mechanism` and same `outcome.type` as any of the last N | error | N = 8 |
| same `premise.key` as any of the last N | error | |
| same `set` as the previous episode (twice in a row) | error | `set_run` = 2 |
| 4 or more of the 5 keys equal to the previous episode's | error | |
| same `title.pattern` in a row, counting this episode | warn | `title_pattern_run` = 3 |
| one `mechanism` or `outcome` in 3 of the last window, counting this one | warn | `repeat_warn` = 3 |

Title patterns are only a warning at a run of 3 because a numbered series title is a deliberate brand choice
(research: number episodes in the title); whether that counts as a template to YouTube is an open hypothesis
(`repetition-tolerance`). Override per world in `world.brief` `policy.distinct`:

```json
"policy": {"distinct": {"last_n": 6, "set_run": 2, "title_pattern_run": 4, "repeat_warn": 3}}
```

The check sees only what the specs say: it cannot tell a cosmetically renamed key from a new idea. The keys are
the author's honest declaration; a reviewer reads them, the tool catches the lazy repeat.

Example output:

```
[perform] error: 03-standup: same mechanism «literal-obedience» and outcome «boss-believes-it» as deploy
[perform] error: 03-standup: the same set «office» 2 episodes in a row (deploy, this one)
```
