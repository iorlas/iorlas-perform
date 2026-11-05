---
name: platform-research
description: Create and refresh the list of hypotheses about how a distribution platform really behaves (recommendation, hooks, retention, moderation, policy, language markets), with evidence, confidence and a lifecycle, on a schedule. Scans GitHub, Hacker News, Reddit and Russian creator communities, logs evidence with source-bias weighting, promotes or kills hypotheses. Use before every new world brief, for "research the algorithm", "update the hypotheses", "what do we know about Shorts", "refresh platform rules", "is this still true", and every few weeks. Decisions about our own world are world-bootstrap; the hook craft is shorts.
---

# platform-research

A living hypothesis list, not a report. Each claim about the platform is a **hypothesis** with dated evidence for and against, a confidence tag and a lifecycle state. Platform statements are **strategic** and weigh least; independent data weighs most. The skill is universal; a2kay (the `a2kay` MCP) is an optional backend. Method taken from Denis's R037 research (`research/youtube-algorithm-research-optimization`, docs `doc/youtube-algorith-hypotheses` and `doc/youtube-algorith-sources` in a2kay): same lifecycle, same source-bias rule.

| file | holds |
|---|---|
| `method.md` | the hypothesis record, evidence log entry, lifecycle, confidence tags, source-bias ranking, promotion and kill rules |
| `sources.md` | what to scan and how (GitHub, Hacker News Algolia API, Reddit, Russian communities, Telegram channels to monitor), query patterns, the scan log |
| `scan.md` | the procedure for a scan run, when to re-scan, how to hand results to world-bootstrap |

## When to run
- **Before each new world brief** (always), and before changing a world's platform, format or cadence.
- **Every 4 weeks** for an active world (7 days for a fast-moving claim such as monetisation policy), or when the channel's retention curve contradicts a hypothesis.
- After any platform policy notice (policy pages change: the "inauthentic content" rename was 2025-07-15).

## Backends
1. **a2kay** if the `a2kay` MCP exists: hypotheses as entities, evidence as dated signals under them (R037 is the model: `find` to list, `read` to load, `create/update` to add evidence). Never edit the vault's files directly.
2. **Repo/world files** otherwise: `<world>/hypotheses.md` (+ `log/YYYY-MM-DD.md`), or the contract the `episode-spec` session defines (`scripts/hypotheses.py`, `docs/contracts/`: not mine; read it when it exists and follow it).
3. A first run's export may sit in `ru-voice-clone/research/hypotheses_export.md` (written by the `hypotheses-research` session): import, do not redo.

## Output
For the caller (world-bootstrap stage 0): the hypotheses that bear on **format, length, hook, audience, cadence, policy**, each with state, confidence, strongest evidence, and what would change it; plus the list of OPEN unknowns. Never present a 3P or FOLK claim as fact.
