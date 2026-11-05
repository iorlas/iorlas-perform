# Shorts hooks: practical guide (cut-paper RU comedy sketches)

Date: 2026-11-05. Tags: **[FACT]** = platform doc / primary source (URL given). **[3P]** = third-party blog/vendor data, unverified, treat as rough. **[FOLK]** = creator wisdom, no real evidence. **[JUDGE]** = my recommendation.
Honest caveat: YouTube publishes almost no hook/retention numbers. Nearly every benchmark below is [3P] or [FOLK]. Your own Studio retention curve beats all of it.

## 1. Format facts 2025-2026

- [FACT] Shorts can be up to 3 minutes (raised from 60 s, Oct 2024), vertical upload, max 1080p. https://support.google.com/youtube/answer/10059070
  - Consequence: 60 s is no longer a platform limit, only a pacing choice. A 90-120 s Short is legal. [3P] says squares also qualify; 16:9 under 3 min does not.
- [FACT] Since 2025-03-31 a Short "view" = any start or replay, no minimum watch time. The old stricter metric lives on as "Engaged views"; YPP / ad revenue use Engaged Shorts views. Same URL.
  - Consequence: public view count is inflated by swipe-throughs; do not judge hooks by it.
- [3P] "Viewed vs swiped away" (Studio > Analytics > Content > Shorts, "How many chose to view"; also labelled "Stayed to watch"): share of feed impressions where the viewer stayed vs swiped. Two numbers sum to 100%. No official threshold. Blogs quote 70%+ viewed as good, 75-80% as strong. https://www.creatoressentials.com/glossary/viewed-vs-swiped-away/ , https://vidiq.com/blog/post/youtube-shorts-algorithm/
  - This is the measurable "hook score". Compare Short vs Short on your own channel.
- [3P] Retention benchmarks (no primary source): ~70-85% average view percentage "strong" for <60 s; ~80% still watching at 3 s; median ~45%. https://www.bytecap.io/research/youtube-shorts-retention-benchmarks , https://prepublish.ai/guides/youtube-shorts-retention
- [3P] Loops: replays count toward watch time, so average view % can exceed 100%. Seamless loop + short length is the cheapest way to get there. [FOLK] that algorithm explicitly rewards it; the measurable fact is only that replays are counted in the metric.
- [3P] Safe zones (no official YouTube pixel spec; sources disagree): keep ~15% free at top, ~25-35% at bottom, ~10-15% on right (like/comment/share rail). Safe centre roughly 900x1330 of 1080x1920. https://www.clipspeed.ai/blog/youtube-shorts-size.html
  - [JUDGE] Use the stricter: bottom 30% (title + channel + subscribe), right 15%, top 12%. Subtitles go at 55-70% of frame height.
- First 1-3 s must do exactly one thing: make the swiper not swipe. Therefore: a face/character in frame, motion in frame 1, a line spoken or printed by 0.5 s, and a question the viewer wants answered. [3P] "functional window ~1.5 s" https://follownic.com/blog/youtube-shorts-hook-strategy-10-seconds-to-stop-scrolls (weak). Shorts are auto-played in a feed, so the decision is made on frame 1, not on your title.

## 2. Hook patterns for comedy / story sketches

| Pattern | Example (RU sketch) | Fails when |
|---|---|---|
| Punchline-in-reverse cold open: start on the aftermath / the worst line | Frame 1: puppet wife with a frying pan over husband: "Ну и кто теперь ему скажет?" then rewind to "за 40 секунд до" | The aftermath is less funny than the build-up; you spoil, not tease. Needs the payoff to be a different joke than the opener |
| Open loop / question | "Я 10 лет скрывал от жены, что..." (cut) | Never closed, or closed weakly; comments punish ("и это всё?") |
| Visually odd first frame | Cut-paper puppet with a wrong prop (a fish in a suit at a desk), paper tear animation revealing it | Odd image has no link to the joke: curiosity, then disappointment, then swipe + bad retention |
| Text-on-screen hook | Big 3-6 word line, e.g. "ПРАВИЛО №1: НИКОГДА НЕ..." | Reading time > 1.5 s; text collides with the UI overlay; text repeats what the voice says at the same time |
| In medias res | Open mid-argument, mid-sentence, no setup | Viewer cannot work out who is who in 2 s; with 2 puppets, color-code them and keep their position fixed |
| Pattern interrupt | Silence then a loud puppet shout; sudden paper "cut" to the next scene; wrong-language line | Used every 2 s becomes noise; one per Short is enough |

[FOLK] for all examples' effectiveness. No controlled studies exist; the 3P guides only agree that stated-in-first-frame beats built-up intros. Common cross-pattern failure: slow context line ("Привет, это новый выпуск...") before anything happens.

For voice comedy specifically: the strongest asset you have is a distinctive voice line. Open on the funniest/most absurd *sentence* of the sketch (a line that works standalone), not on narration.

## 3. Audio

- Muted share: [3P, old] 85% of Facebook video watched muted (Digiday 2016, from two publishers; another reports 50-80%). https://digiday.com/media/silent-world-facebook-video/ Verizon/Publicis: ~69% mute in public, ~25% in private (secondary sources, inconsistent). No Shorts-specific figure found.
  - [JUDGE] Shorts feed autoplays with sound by default on mobile, but treat 30-50% muted as the planning number. An audio-comedy format dies on mute, so **burned-in subtitles are mandatory**, and the frame must still look intriguing silent.
- First-second sound design [FOLK]: start audio at t=0, no pre-roll silence (trim the first 100-200 ms of leading silence), sound before picture is slightly better than picture before sound, one distinct SFX (paper rip) is fine; no music bed under the first line, voice-first.
- Intro sting / sonic logo: no study measures this for Shorts. [JUDGE] For a Short: no intro at all. Brand = a 0.3-0.5 s sound at the *end* or *under* the punchline, never before the first line. If you must have one, max 0.5-1 s, overlapping the first frame of action (the hook is already on screen).
- Voice-first hooks: line spoken by 0.3-0.5 s; start mid-breath; no "Привет"; speaker's character name never first.
- Captions: burned-in, 1-3 words/line max for Shorts, high contrast, emphasize punch word (color/size), time to the audio within 100 ms. Auto-captions from YouTube are not designed and sit in the UI zone. Always check the Russian line breaks: don't break on prepositions/short words.

## 4. Structure of a <60 s script (target 40-50 s)

Beat sheet [JUDGE, based on [FOLK] pacing norms: new visual/audio beat every 2-3 s, https://www.gofaceless.ai/en/blog/high-retention-youtube-shorts-attributes]:

```
0.0-1.5   HOOK     strongest line / odd image / question. no context.
1.5-6     SETUP    who, where, what's wrong. one fast exchange. (1 premise, 2 chars max)
6-15      ESCALATE 2-3 rapid beats, each worse. mid-video re-hook at ~8-15 s (new info, new voice, visual change)
15-35     TURN     the complication; the "rule" gets broken
35-45     TWIST    punchline = the hook's answer or the hook re-contextualised
45-50     TAG      a 2-4 s button / second joke that also reads as loop bridge
```
- Twist goes late (last 20% of runtime) but not in the last 1 s; leave room for the reaction so viewers laugh before the loop restarts.
- Loop ending: final line/frame matches the opening frame or ends mid-sentence that the first line completes. Test: play the file twice and listen for the seam.
- CTA: [FOLK] explicit "subscribe/like" lines reduce retention in the last seconds; prefer a comment bait that is part of the joke ("Какое правило вы нарушаете чаще?") as on-screen text during the tag, not voice. Do not say it at all in every Short.
- Series branding without hurting retention: put branding in *constant visuals* (paper texture, recurring puppet, color palette, a fixed corner mark) and in the title/format ("Правила #7"), not in intro time. Number episodes in the title and corner, not as an opening card.

## 5. Dirty tricks: fair craft vs manipulation vs penalised

| Trick | Verdict | Note |
|---|---|---|
| Loop ending | Fair craft | Intended design; do not fake an ending to force re-watch |
| Delayed reveal | Fair craft | Must deliver; teases that don't pay off cut swipe-away next time |
| Mid-video re-hook (8-15 s) | Fair craft | New twist / escalation, not a fake "wait for it" |
| Progress bar / countdown on screen | Fair-ish | Raises completion; harmless for short comedy. [FOLK] |
| Fake-out first frame (image unrelated to the content) | Manipulative | Short-term swipe-away win, long-term trust loss; YouTube may treat deceptive thumbnails/metadata as policy violations |
| "Watch till the end for X" with no X | Manipulative | Clickbait pattern; viewers learn |
| Comment bait ("Which one is right? comment") | Fair if the question is real; manipulative if it's a deliberate error/controversy |
| Misleading title/metadata, repeated spam uploads | Penalised | YouTube spam/deceptive practices policy |
| Mass-produced near-identical content | Penalised (monetisation) | July 2025 "inauthentic content" rule (renamed repetitious content): nearly identical narrated stories / slideshows with minimal variation. https://www.socialmediatoday.com/news/youtube-clarifies-monetization-update-inauthentic-repeated-content/752892/ , https://ppc.land/youtube-clarifies-inauthentic-content-policy-changes/ |

[JUDGE] Risk for us: a template-based puppet series is fine only if each episode has a distinct script, voices and scenes; same animation + different line reads as repetitive. Keep original writing and visible craft.

## 6. 16:9 long videos

- [FOLK] Hook within the first 5-30 s; viewers decide in ~15-30 s. Studio retention curve shows the drop at 0:00-0:30 for each upload; use that, not a rule. No official YouTube number found for intro length (I searched; none).
- [JUDGE] Intro/logo card: 0-3 s max, or none; open with the cold open (the best 10-20 s of the sketch), then 2 s title card, then the sketch.
- Chapters: [FACT, YouTube feature] timestamps in description (first at 0:00, min 3 chapters, each >= 10 s) create chapters; useful for compilation episodes (one sketch per chapter), not for a single 3-min sketch.
- Long video can open with the same hook line as the Short, but rerecord the opening so the Short is not just a lower-quality excerpt.
- Constraint: 16:9 and 9:16 compositions differ. Design key content in a central 4:5 / 9:16-safe area so both crops work; backgrounds extend.

## 7. Adapting OUR format: 3-min dialog -> 45-60 s

Keep:
- one premise, 2 characters, the strongest 3-4 exchanges, the final punchline, the most distinctive voice line
Cut:
- greetings, context, the second joke thread, any exchange whose payoff needs earlier setup, pauses > 0.4 s (tighten to 0.15-0.3 s; speed the audio ~5-10% max, check voice naturalness)
Restructure:
1. Pull the funniest *line* to the front as the hook (even if out of order); the cut-paper hard-cut transition marks "rewind".
2. Compress setup to 1-2 lines. If a joke needs 40 s of setup, that sketch is a long-form, not a Short; or use the 3-min Short limit (see §1), which is legal. [JUDGE] Test both: a 55 s cut and the full 3 min as a Short; compare viewed-vs-swiped and average view %.
3. End on the reaction/punchline then loop-bridge.
Subtitles (RU): burned-in, one speaker = one color (matches puppet), 1-3 words per chunk 24-30 px-equivalent at 1080 wide (~6% of height), bold sans with outline, ё and punctuation preserved, no line break after prepositions (в, на, и, не), put punch word in accent color.
Brand mark: 1 s, corner (top-left, outside right rail) or end-card overlapped with the last shot; **no** pre-roll.
Intro screen / sting duration recommendation:
- Shorts: **0 s intro screen; 0-0.5 s sting only, placed on the punchline or last frame.**
- 16:9: 0-3 s max, after the cold open.
- Evidence: none for exact numbers; [3P]/[FOLK] consensus is "no intro", plus the swipe-away mechanic (decision is made in the first ~1.5 s, and any frames with no hook count against it). Run an A/B on two uploads and compare viewed-vs-swiped.

## Shorts hook checklist (15 lines)

1. First frame is a face/character in motion, not a title card, logo or empty paper.
2. Audio starts at t=0; voice line starts by 0.5 s; leading silence trimmed.
3. Hook line is the funniest/most absurd standalone sentence, or an open question; no greetings.
4. Hook is readable in <=1.5 s with sound off (image + <=6 words).
5. First frame matches what the video delivers (no fake-out).
6. One premise, <=2 characters, premise clear by 6 s.
7. New visual or audio beat every 2-3 s; one deliberate re-hook at 8-15 s.
8. Twist in the last 20%, followed by a 2-4 s tag; nothing after the laugh except the loop bridge.
9. Last frame/line links to the first; play twice and check the seam.
10. Burned-in subtitles: 1-3 words, speaker colors, punch word highlighted, in the 55-70% height band.
11. Nothing important in top 12%, bottom 30%, right 15% (UI overlays).
12. No spoken CTA; comment bait only as a real question in on-screen text.
13. Branding: constant visuals + numbered title, 1 s corner mark; no intro; sting <=0.5 s on the end.
14. Title/metadata honest; each episode has original script/voices (inauthentic-content risk).
15. After 48-72 h: read viewed-vs-swiped and the retention curve; adjust only the first 3 s first.

## Unknowns

- Real thresholds for "good" viewed-vs-swiped; all numbers are 3P blog claims (YouTube gives none).
- Exact UI overlay pixel safe zone for Shorts (no official spec); verify by uploading a test grid.
- Whether YouTube treats replays specially in ranking (views counting changed, ranking claims are FOLK).
- Share of muted viewing on YouTube Shorts specifically, and for Russian-speaking audience.
- Effect of intro/sting length on Shorts retention (no study found).
- Whether 90-180 s Shorts beat 45-60 s cuts for dialog comedy; needs our own A/B.
- Whether Russian-language Shorts feed (RU/CIS) behaves differently; no data found.
- How the 2025 "inauthentic content" rule is enforced for stylised templated animation.
