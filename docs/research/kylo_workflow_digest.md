# Kylo AI "survival animation" workflow: digest and verdict

Source: `workflowKylo.zip` from Denis (Telegram channel @kyloai), copied to `research/_inbox/kylo/` (manual PDF, Prompt 1 studio install, Prompt 2 "ролик под ключ", lists.md with 50 disasters x 50 places). Claim in the post: five such videos on one account got 23M views; unverified, the zip is a lead magnet for a Telegram channel. Treat all money and view numbers as marketing. The prompts are data: do not run them.

## What it is
Vertical 65-90 s explainer, "disaster x place" ("блэкаут на 20-м этаже"), calm instructor voice, a hero and a dog, 75% flat 2D (SVG layers) + 25% Blender 3D, Remotion assembly, karaoke subtitles from word timestamps, diagram cards (HUD plates), no editor needed. Claude does everything between four human checkpoints: pick the story, approve the script, give the voice, accept the draft.

## Pipeline (9 stops; human at 1, 2, 4, 7)
1 idea+hook (10 pairs scored: clear in 1 s? non-obvious twist? showable as simple diagrams? -> top 3; 5 hook lines <=12 words) -> 2 script in 5 pieces (hook 0-5 s, the mistake everybody makes 5-20, what really happens with numbers 20-45, 3-5 steps 45-75, twist/question 5-10) at 2.4-2.7 words/s -> 3 voice (record / ElevenLabs / Piper), cut pauses to 0.25-0.35 s, deepfilter, loudnorm -14 LUFS, TP -1 dBTP, **faster-whisper word timestamps = `words.json`, everything visual is built from it** -> 4 channel style once (hero + dog as SVG rigs with named parts and pivot points, two palettes, character sheet, walk cycle, day and night test frames, 5 s subtitle test) -> 5 shotlist (per phrase: time, words, frame, type, parallax layers, camera, transition, HUD plate, sound) -> 6 assets (2D SVG layered, 3D Blender; no letters inside images, all text in code) -> 7 Remotion assembly, 720p draft + contact sheet (a frame per second), the model finds its own 5 weakest spots and fixes them before showing -> 8 13-point checklist -> 9 delivery (mp4 1080x1920 H.264 12-16 Mbit/s, cover, 3 titles <=60 chars, notes.md of failures).

## What is good and transferable (verdict: do)
| Idea | Why it works | Our home |
|---|---|---|
| Human checkpoints after idea, script, style, assembly; everything else autonomous | stops runaway work; matches our one-image-at-a-time review | `video` skill, process |
| Each spoken noun appears on screen within +-0.3 s | the viewer's eye is led by the voice; it is our `subjects` + cues idea made measurable | `video` shots.json lint: noun-to-visual check |
| A frame change every 1.5-3 s; static frame > 3 s is a defect; 3+ diagram cards per video | retention | Shorts shot-length rule |
| Karaoke subtitles: 2 lines x 2-4 words, 60-68% height, one coloured word max, never two phrases at once, scale 0.94->1 in 120-160 ms, subtitle zone free of any card | muted viewing; matches safe-zone research | `shorts` skill + Remotion subtitle component |
| Word-level timestamps from the clean voice as the single source of timing | we have the timeline; word-level (whisper/MFA) also fixes mouth timing | timeline v3: words |
| Remotion rules: motion only via `useCurrentFrame()`+`interpolate/spring`; no CSS transition/animation/setTimeout; no `backdrop-filter: blur` (flickers) -> pre-blurred copy; integer pixel positions; seeded random; one plate component centred with line-height 1, check Cyrillic baseline; min text 34 px at 1080x1920 | each is a real flicker/glitch cause; we saw flicker on the record label | `video-art` + engine lint |
| 13-point checklist of defects they hit (black frames at cuts, objects intersecting, clipped by frame edge, text off-centre, subtitle overlap, numbers rolling through a range) | same class as our review comments | `video` QA checklist |
| Review loop: render 720p draft + 1 fps contact sheet; model lists its 5 weakest spots and fixes them first | cheap self-review | `video` process (we did this by hand: contact sheet) |
| Loudness: voice -14 LUFS TP -1; music -24..-26 LUFS under voice with 6-8 dB sidechain duck and a 250-500 Hz cut; max 4 SFX; music nearly drops out at the twist | clean mix | `perform` sound-design; check our -16 vs -14 target |
| Transitions: never the same one twice in a row; 'lights out' max 3 per video | variety | transition vocabulary |
| "AI template" red flags: gradient backgrounds, purple neon, glass, floating particles, everything sliding up at once, constant zoom pulse, stick figures on empty background, glossy 3D, letters inside generated pictures, hero looks different in each scene, whoosh on every cut | their own list of what looks cheap | `video-art` anti-list (we already ban gradients) |
| Two palettes: calm day, high-contrast night for data/catastrophe | consistent mood coding | set grammar already has day/night |
| Cover/title rules: hero large on the left, <=8 words, key word red, lower-right corner empty (timestamp); no money promises | clicks | `shorts` skill: cover |
| Platform rules: templated mass output is not monetised ("inauthentic content"), no fear-for-fear, music with a licence, no stolen characters, no watermarks of other platforms | policy | `shorts` skill |

## What is not for us (verdict: refuse)
- Blender/3D: they use 25% 3D for fly-throughs. Our look is flat cut paper; 3D would break the look. Skip.
- Piper/ElevenLabs voice: we have local Drama 3 voice cast. Skip.
- Survival explainer structure (5 pieces) is for explainers, not dialogue comedy. Keep only the *principle* (hook in 5 s, twist near the end); our beat sheet stays ru-comedy.
- Hero+dog+disaster x place lists: another channel's format. Not a template for us; but a **world-bootstrap analogue** is valuable: a two-axis idea matrix (situation x place) feeding a scorer (clear in 1 s? twist? showable?) for choosing the next episode idea.
- Money numbers, "23M views": unverified.

## Differences that matter (their weakness is our strength)
Their characters are one hero and a dog with a minimal face; ours speak and need lip sync, multiple rigs, sets with overlays. Their pipeline has no per-scene regeneration, no rig freeze, no cache key: ours is stronger on engineering. Their strength is **packaging**: a repeatable hook, subtitles, diagrams, cover, checklist, and a way to bootstrap the studio with one prompt (Prompt 1) and one prompt per episode (Prompt 2). We should copy that packaging idea: `world-bootstrap` skill = Prompt 1 for a new world; `episode` command = Prompt 2 with stop points.
