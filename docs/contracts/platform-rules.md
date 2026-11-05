# platform_rules and check_policy

What a platform says, and what is still unknown. YouTube's written policy is a floor, not the whole picture: rules
change ad hoc and part of them are unwritten, so each rule records where it came from and when it was read.
`<world>/platform_rules.json`, tool `scripts/policy.py`:

```
policy.py init WORLD                 copy the seed rules
policy.py list WORLD
policy.py check WORLD [--stale-days N] [--spec SPEC]    check_policy: run before publishing
```

| field | meaning |
|---|---|
| `id`, `platform`, `statement` | |
| `written` | true when the platform's text says it, false for lore |
| `quote` | the platform's words, verbatim; required for `FACT` |
| `source_url`, `fetched` | where and when (ISO date) the source was read |
| `confidence` | `FACT` `3P` `FOLK` `TESTED` `OPEN` |
| `status` | `known` or `OPEN` |
| `check` | optional: the deterministic check that guards it (`distinct`, `cadence`) |

## check_policy

Lists, then exits 1 while anything is unresolved:
- every OPEN rule not acknowledged (level `open`);
- an OPEN rule acknowledged in `world.brief` `policy.acks` (`{rule, decision, date}`): a warning, a conscious decision to publish anyway;
- a known rule with no `source_url` (an OPEN rule may have none), or any rule with no valid `fetched`; a rule fetched more than 90 days ago;
- with `--spec`: the distinct check for that episode.

Resolve a rule by reading the platform and editing its `status`, `confidence`, `quote`, `fetched` (or by an experiment).

## Seed (YouTube, read 2026-11-05 from support.google.com/youtube/answer/1311392)

| id | confidence | status |
|---|---|---|
| `yt-inauth-template` «looks like it's made with a template» | FACT | known, guarded by `distinct` |
| `yt-inauth-same-situation` «same situation over and over again with the same outcome» | FACT | known, guarded by `distinct` |
| `yt-inauth-minimal-variation` «minimal variation across videos» | FACT | known, guarded by `distinct` |
| `yt-series-set-characters` a series following a set of characters is allowed; each video needs its own storyline (our reading) | FACT (quote) | known |
| `yt-animation-treatment` the page does not mention animation | OPEN | OPEN |
| `yt-synthetic-voice` the page does not mention synthetic voice | OPEN | OPEN |
| `yt-mass-upload` dozens of near-identical uploads a day | 3P | known |
| `yt-deceptive-metadata` mismatched first frame or title | 3P | known, not re-fetched |
| `yt-unwritten` enforcement details are unpublished | OPEN | OPEN |

On that page the policy appears under «Generic or Repetitive Content»; it is the renamed «inauthentic content» rule
(2025-07-15). The «distinct storyline» condition is the research file's reading, not a quoted line.

## Example

```json
{
  "id": "yt-animation-treatment", "platform": "youtube", "written": false,
  "statement": "How stylised, reusable animation (one rig, many episodes) is judged under the repetitive-content rule.",
  "source_url": "https://support.google.com/youtube/answer/1311392", "fetched": "2026-11-05",
  "confidence": "OPEN", "status": "OPEN",
  "note": "The page does not mention animation. Unresolved; resolve with an experiment or a platform answer, or acknowledge in world.brief policy.acks."
}
```
