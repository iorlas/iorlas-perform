# world.brief

What a world is for, decided once by a human. `world.py new WORLD` writes it with every field `OPEN`;
`world.py check WORLD` validates it and lists what is still OPEN. It never invents a value.

| field | type | meaning |
|---|---|---|
| `schema` | `"world.brief/1"` | |
| `world` | str | the world's name |
| `platforms` | list[str] | where it is published, free text (`youtube-shorts`, `youtube`) |
| `formats` | list[str] | ids from `contracts/formats.json` (`shorts-9x16-60s`, `landscape-16x9-3min`) or the world's `formats.json` |
| `length_s` | `{min, max}` | length range in seconds; a warning when `max` is above a chosen format's hard max |
| `audience` | `{language, who}` | |
| `genre`, `tone` | str | |
| `cadence` | `{per_week, note?}` | how often; `policy.py` rule `yt-mass-upload` refers to it |
| `policy` | `{constraints[], acks[]?, distinct{}?}` | the world's own constraints; `acks` acknowledge an OPEN platform rule; `distinct` overrides limits (see [distinctness.md](distinctness.md)) |
| `metrics` | `{primary, secondary[]}` | ids: `viewed_vs_swiped`, `retention_3s`, `retention_10s`, `retention_end`, `avg_view_duration`, `avg_view_pct`, `engaged_views`, `ctr`, `comments_per_view`, `subscribers_per_view`, `studio_policy_notice` |

## Format profiles (`contracts/formats.json`)

| id | length | hook window | words/s band | notes |
|---|---|---|---|---|
| `shorts-9x16-60s` | target 45-58 s, gate: under 60 s | 3 s (voice by 0.5 s) | 1.4-3.2 | hook line at most 12 words; safe zone top 12%, bottom 30%, right 15% |
| `landscape-16x9-3min` | target 150-178 s, at most 180 s | 15 s (voice by 3 s) | 1.2-3.0 | |

Values carry a `confidence` (FOLK or 3P: the research has no official numbers) and a `source`. The 60 s gate is a
house pacing choice, not a platform limit (Shorts may run 3 min); experiment `length-55s-vs-180s` tests it.

## Example (a fixture world)

```json
{
  "schema": "world.brief/1",
  "world": "vadik",
  "platforms": ["youtube-shorts"],
  "formats": ["shorts-9x16-60s"],
  "length_s": {"min": 45, "max": 58},
  "audience": {"language": "ru", "who": "office workers, 20-40"},
  "genre": "office comedy",
  "tone": "dry, deadpan",
  "cadence": {"per_week": 2, "note": "OPEN until the first uploads give a baseline"},
  "policy": {"constraints": ["no spoken CTA"], "acks": [{"rule": "yt-synthetic-voice", "decision": "publish and watch Studio notices", "date": "2026-11-05"}], "distinct": {"last_n": 6}},
  "metrics": {"primary": "viewed_vs_swiped", "secondary": ["retention_3s", "avg_view_pct"]}
}
```
Source: `tests/fixtures/worlds/vadik/world.brief.json`.
