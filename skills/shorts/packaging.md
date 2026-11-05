# shorts: packaging

## Subtitles (burned in, mandatory)
- **2 lines x 2-4 words** per chunk (1-3 for the tightest hooks), centred, at **55-70 % of frame height** (Kylo: 60-68 %); never two phrases on screen at once; timed to the audio within 100 ms (word timestamps: video skill, timeline v3).
- One speaker = one colour (matches the puppet); **at most one accent-coloured word** (the punch word); bold sans, outline for contrast; at 1080 wide about 6 % of height, min 34 px; Cyrillic baseline checked; `ё` and punctuation kept.
- Line breaks never after a preposition or short word (в, на, и, не, с, к).
- Pop-in: scale 0.94 -> 1 over 120-160 ms via `interpolate`, no CSS transition.
- The subtitle zone is free of any card or overlay.
- YouTube's auto-captions are not designed and sit in the UI zone: do not rely on them.
- Build with `@remotion/captions` `createTikTokStyleCaptions` from the word timeline: one `Sequence` per page, highlight the current token.

## Safe zones (1080x1920; no official pixel spec, JUDGE: use the stricter)
```
 top 12 %      status bar / search          nothing important
 right 15 %    like / comment / share rail   nothing important
 bottom 30 %   title, channel, subscribe     nothing important
 centre ~ 900 x 1330                         action and faces
 subtitles at 55-70 % of height
```
Verify once by uploading a test grid as an unlisted Short. Design key content in the central 4:5 area so a 16:9 re-crop also works; backgrounds extend.

## Intro, sting, corner mark
| item | 16:9 | Shorts |
|---|---|---|
| intro card | 0-3 s max, after the cold open (best 10-20 s) | **none** |
| sting | <= 0.5-1 s, on the card | **<= 0.5 s**, on the punchline or last frame; never before the first line; no music bed under the first line |
| corner mark | optional | **1 s**, top-left outside the right rail, or an end card overlapped with the last shot |
| series name | card | title + corner number |
A sting that fits Shorts is a snap plus a short rising blip, not a gag: an old 9.4 s audio intro with a 4.4 s gag before the name was 3x the card cap and 20x the sting cap. Judge a sting by ear; length and loudness are not evidence. Loudness: see perform (the video master is -14 LUFS).

## Cover and title
- The cover is a frame from the Short or a `<Still>` rendered from the same rigs: **hero large on the left**, <= 8 words, the key word in the accent colour, **lower-right corner empty** (timestamp / UI).
- Title <= 60 characters, honest, numbered ("Правила #7"); give 3 options. No money promises.
- Delivery: mp4 1080x1920 H.264 at 12-16 Mbit/s, AAC, a `notes.md` of failures.

## Policy points
- Templated mass output is not monetised (July 2025 "inauthentic content"): vary scripts, voices and scenes; keep a human edit pass; do not publish near-identical templates daily.
- No fear-for-fear content, no stolen characters, no other platforms' watermarks.
- Music and SFX need a licence: store source URL + licence per asset in the episode manifest (YouTube Audio Library is claim-safe on YouTube only; Freesound per file: CC0 ok, CC BY credit, CC BY-NC unusable).
- Misleading titles/metadata and a fake-out first frame risk the deceptive-practices policy.
- Remotion licence: free for individuals and companies up to 3 people; read the licence page before monetising or shipping to others.
