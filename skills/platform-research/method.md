# platform-research: method

## Hypothesis record
```
H<nn>: <one falsifiable claim, present tense, about the platform or the audience>
state: ACTIVE | SUPPORTED | VALIDATED | CONTRADICTED | INVALIDATED     (confidence now: HIGH/MEDIUM/LOW, with the tag)
scope: platform, format, language market, date range it was observed
belief: what we currently believe and what it changes for us (the decision it affects)
for:     [ evidence entries ]
against: [ evidence entries ]
experiment: link to our own test, if any (PROPOSED -> RUNNING -> COMPLETED)
updated: date
```

## Evidence entry (atomic, permanent, dated)
`date | source (URL or id) | source type | confidence tag | bias tag | what it says (quote or number) | for/against | independence note`
Keep the raw observation; never overwrite an entry, add a newer one.

## Confidence tags
- **FACT**: read on a primary page (platform doc, repo, API response), quoted.
- **3P**: third-party blog, vendor, report; unverified.
- **FOLK**: creator wisdom, no evidence behind it.
- **TESTED**: our own experiment with data from our channel.
- **JUDGE** (our recommendation) is a decision, not evidence.

## Source bias
Credibility (is it rigorous?) and trustworthiness (does it have an incentive to mislead?) are separate. Tag **STRATEGIC** on sources from the platform itself (help pages, blog, executives, papers aimed at creators): they describe what the platform *wants creators to do*, not necessarily what it rewards; the tag does not reduce credibility, it adds a warning. A platform's **policy text is still the source of truth for the rule itself** (quote it), but **not** for what the ranking rewards.

Weight when evidence conflicts (heaviest first):
1. independent empirical data (A/B tests with numbers, large observed samples);
2. observable patterns (what measurably works at scale: what channels that win actually do);
3. our own observations and experiments (TESTED outranks everything about our own channel);
4. academic and patent sources (architecture may differ from the implementation);
5. platform communications (STRATEGIC): lowest.
When independent data contradicts a platform statement, the independent data carries **more** weight.

## Lifecycle
```
ACTIVE -> SUPPORTED   at 3+ independent evidence points (different people/channels/datasets; one author on three sites counts once)
SUPPORTED -> VALIDATED   our own experiment confirms it (experiment record, numbers, date)
ACTIVE/SUPPORTED -> CONTRADICTED   strong counter-evidence (rank 1-3 source) -> INVALIDATED after a second independent contradiction or our test fails
```
- A hypothesis with only FOLK/3P evidence stays ACTIVE however many posts repeat it.
- Re-check VALIDATED ones when the platform changes a mechanism (policy notice, metric rename).
- Never delete: INVALIDATED stays, with why, so nobody re-adds it.

## Experiments
PROPOSED -> RUNNING -> COMPLETED, each linked to a hypothesis. One variable, a stated hypothesis, a metric from the world brief (viewed-vs-swiped, retention at 3 s, average view %), N episodes, the decision rule written before the run. Two uploads is an anecdote: record it as TESTED (weak).

## What not to do
- Do not average blog opinions into a "consensus".
- Do not treat view counts of someone's channel as evidence about method; a survivor's channel is one sample.
- Do not copy another creator's numbers ("23M views") without an independent source.
