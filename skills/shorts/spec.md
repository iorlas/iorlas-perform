# shorts: engine requirements (spec for the later coding; nothing here is implemented)

Context: the engine is landscape-720, camera viewBox 16:9, sets drawn wide. Shorts needs a new output, not a crop of the wide render.

## 1. Format profile
`video/formats/<name>.json`, chosen by `--format` (default from the world):
```
landscape-720:   { "size":[1280,720],  "fps":30, "lufs":-16, "frames":{...}, "max_zoom":1.6, "subtitle": null }
shorts-1080x1920:{ "size":[1080,1920], "fps":30, "lufs":-14, "tp":-1, "safe":{"top":0.12,"bottom":0.30,"right":0.15},
                   "subtitle":{"y":[0.55,0.70],"words":[2,4]}, "max_len_s":60, "target_len_s":[40,50], "hard_max_s":180 }
```
The cache key includes the format name, size and fps. Loudness target is a format field (landscape episodes stay -16 LUFS podcast spec; vertical feed -14 LUFS, true peak -1 dBTP).

## 2. Portrait cameras
- Sets stay wide drawings. The portrait view is a 9:16 **crop window** moving over the art: `subjects_camera` with canvas = the art, aspect = 9/16.
- Default **one subject per shot**; two-subject dialogue becomes alternating singles (shot-reverse-shot) with AR7 positions mirrored; a two-shot only when the two fit the crop at zoom >= 1.0 (a wide set gives about 3-4 person-widths of height).
- `place` thirds apply horizontally; vertical placement puts faces at 35-45 % of height (above the subtitle band, below the top safe zone).
- Set tiers A/B/C get a `portrait` check: the crop must not cut a set into nonsense; sets with a strong horizontal composition need a tall variant (flagged in the census).
- Inserts (screens, cards) are drawn full-width in the portrait frame; text >= 34 px; never in the safe-zone margins.

## 3. Subtitles component
Remotion component built from the word timeline (`@remotion/captions`), rules in `packaging.md`; speaker colours from the world layout; a lint fails if any element enters the subtitle band while a caption is on.

## 4. Hook gate (lint on shots + timeline, fails the render)
- first shot contains a speaking or moving cast member (not a card);
- audio: first voice onset <= 0.5 s; leading silence <= 0.2 s; no music bed under the first line;
- a printed hook <= 6 words and <= 1.5 s reading time, or a spoken hook;
- no greeting words in the first turn (configurable stop-list);
- a shot change or cue at least every 3 s (a static frame > 3 s is an error; warn at 2.5 s);
- a re-hook (new shot type, new speaker, or screen state) between 8 and 15 s;
- first and last frame comparable for the loop (warn when the last shot's focus differs from the first shot's focus and the last line does not complete the first).

## 5. Length gate
`target_len_s` warn outside it, `max_len_s` error above 60 s unless `--allow-long` (then `hard_max_s` 180); report the cut-down candidates (turns with the lowest laugh/plot value from the scenario map) when over.

## 6. Intro rules in code
No intro card on `shorts-*`; sting <= 0.5 s placed by a cue on the punchline beat; corner mark 1 s at the safe-zone-clear position; an end card overlapped with the last shot.

## 7. Cover
`render-cover`: a `Still` of a chosen shot at a portrait crop, with the hero on the left third, a text plate <= 8 words, lower-right empty.

## 8. Tests
Portrait camera keeps every subject inside the crop and outside the safe margins; a two-subject shot raises or splits; the hook gate fails on a card-first fixture and passes on a cold-open fixture; the length gate fails a 70 s fixture.
