# platform-research: what to scan

Log every scan (date, source, query, hits kept, hits dropped) in the scan log (the world's `log/` or a2kay). Prefer reproducible queries; a scan nobody can repeat is not evidence.

| source | how | what to look for | notes |
|---|---|---|---|
| **GitHub** | `gh search repos "<query>"`, `gh search code`, repo READMEs/issues; Remotion/Claude video skills | tooling that works (stars, last commit, licence), prompts/workflows others use | tag stars and dates; low-star repos are ideas, not evidence |
| **Hacker News** | Algolia API: `https://hn.algolia.com/api/v1/search?query=<q>&tags=story` and `search_by_date`; comments `tags=comment` | threads on the algorithm, creator tools, policy changes; read the comment threads, they hold the counter-evidence | free, no key; filter by `numericFilters=created_at_i>X` |
| **Reddit** | search pages / the `.json` endpoint if reachable (`r/NewTubers`, `r/PartneredYoutube`, `r/youtubers`, `r/shortstube`, `r/animation`); if blocked, say so, do not guess | first-hand creator reports, policy-flag stories | often blocked or rate-limited: log "unreachable" |
| **vc.ru** | site search, creator/marketing posts | Russian market claims, monetisation, platform changes in RU | note author interest (selling a course) |
| **Habr** | search, hubs on video/AI/YouTube | technical and tooling write-ups | usually better quality, fewer numbers |
| **DTF** | video/games/animation sections | animation creators, format trends | |
| **Pikabu** | search for creator experience posts | folk wisdom: mark FOLK | |
| **Video-maker / YouTuber forums** | creator forums in Russian-speaking communities (name them in the scan log when found) | monetisation and policy-notice reports | |
| **Telegram channels** | monitor **by name** (a list in the world: `sources.md`); read recent posts via the public web view `t.me/s/<name>` | creator communities, AI-video workflows (the outside workflow reviewed here came from one such channel) | high marketing share; claims are 3P/FOLK until independently confirmed |
| **Platform help pages and policy** | fetch the page, **quote** the rule with URL and date | the rule text itself | STRATEGIC for ranking claims; authoritative for what the policy says. Re-fetch before each world brief |
| **Platform Studio analytics (ours)** | the world's own numbers | TESTED evidence | the only data about our channel |

## Monitored list
Keep `monitored.md` in the world: creators and channels whose experiments you trust (name, link, why, last checked). Add after reading a few of their pieces; drop when stale. Log additions.

## Quality checks before logging a source
Author identity and incentive (selling something?), date (platform changes fast), sample (one channel or many), numbers (raw or claimed), can it be independently confirmed (a second unrelated source)?
