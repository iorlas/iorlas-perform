# platform-research: a scan run

1. **Load** the current hypotheses and the last scan log. Pick the questions: those that block the next decision (a new brief's fields, a failing metric) first, then the oldest-checked.
2. **Search** per `sources.md`, one query at a time, logging each. Cap a run (for example 60 minutes or 30 sources); unreachable sources are logged, not skipped silently.
3. **Read the primary** (fetch the page, quote it); a summary of a summary is not read.
4. **Log evidence** (`method.md` entry), attached to a hypothesis, or open a new one.
5. **Update states** by the lifecycle rules; list what changed.
6. **Distill** into the brief-facing summary: for each of format, length, hook, audience, cadence, policy: the current belief, confidence, and what would change it.
7. **Hand over:** the summary goes to world-bootstrap stage 0 (brief fields carry evidence tags), policy changes to the platform rules (`policy.py` contract when it exists), proposed experiments to the experiments list.
8. **Schedule:** next scan date in the log. A cron/loop is allowed to remind, but a scan is run by an agent with a human reading the summary: no unattended publishing from it.

Cadence: before every new world brief; every 4 weeks per active world; 7 days after a platform policy notice; when a metric surprises.

Unknowns stay unknown: write them in an OPEN list (real thresholds for "good" retention, exact safe-zone pixels, enforcement on stylised animation); do not fill them from FOLK.
