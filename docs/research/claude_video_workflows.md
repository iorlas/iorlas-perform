# Claude-made animated video workflows: external landscape (2026-11-05)

Method: web search + page fetches, one pass. Tags: FACT = read on a primary page (repo/docs); 3P = third-party claim (blog, directory, vendor); FOLK = common belief, no source found. Not run or installed anything. Digest of the Kylo zip is in `kylo_workflow_digest.md` and is not repeated.

Honest gaps (searched, not found):
- No Reddit or Hacker News thread surfaced for any of the topics.
- No creator-level "how this zombie channel is made" breakdown exists in what I could reach. Kylo AI / "23M views": zero independent hits (3P-unverifiable).
- No view counts for the stick-figure zombie format except one channel quoted by a vendor site.
- No Russian-specific accuracy numbers for any aligner.

## 1. Repos, skills, write-ups

| Item | What it does | Evidence (stars / date / licence) | Reusable by us |
|---|---|---|---|
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Official skill pack: best-practices, create, markup, studio, render, captions, docs, license, upgrade, multimedia, maps, saas, interactivity. Install `npx skills add remotion-dev/skills`; also [Claude Code plugin](https://remotion.dev/docs/ai/claude-code-plugin) | FACT: 6.4k stars, 696 forks, 95 commits. Licence not shown on page; text instructions, not code (3P: llmbase listing) | Yes: `remotion-best-practices` + `remotion-captions` as reference for our `video-art` rules (frame-driven motion, no CSS transitions) |
| [upbrew-tech/svg-creator-skill](https://github.com/upbrew-tech/svg-creator-skill) | Skill: agent writes SVG, renders to PNG with `scripts/svg_loop.py` (CairoSVG or Chromium), looks, fixes, repeats 2-8 times. Covers characters, gradients, 5-zone lighting, CSS/SMIL animation | FACT: 41 stars, 2 commits, Apache-2.0. 3P ([skills.sh](https://www.skills.sh/upbrew-tech/svg-creator-skill/svg-creator)): 83 installs, first seen 2026-05-26, Socket audit pass 2026-08-07 | Idea, not code: render-look-fix loop for new rig parts. Its style (gradients, lighting) clashes with flat cut paper |
| [ahujasid/blender-mcp](https://ossinsight.io/analyze/ahujasid/blender-mcp) | MCP bridge Blender <-> LLM | 3P ([aiwiki](https://aiwiki.ai/wiki/blender_mcp/raw)): 32.7k stars, 2.9k forks at 2026-10-30; MIT in every source; renamed "MCP for Blender" 2026-09 (single source, verify) | Ignore: 3D breaks our look |
| [JJenglert1/remotion-claude-video](https://github.com/JJenglert1/remotion-claude-video) | Starter kit + video tutorial, preinstalled Remotion skill | not checked (stars, licence unknown) | Reference only |
| [fernandokaraka/remotion-motion-graphics-skill](https://github.com/fernandokaraka/remotion-motion-graphics-skill) | Title cards, lower thirds; MP4 or transparent ProRes/PNG | not checked | Low: lower-third idiom |
| [wilwaldon/Claude-Code-Video-Toolkit](https://github.com/wilwaldon/Claude-Code-Video-Toolkit) | Index of skills/MCP for Remotion, Manim, FFmpeg | not checked | Browse for ideas |
| [MushroomFleet/Remotion-Claude-Code](https://github.com/MushroomFleet/Remotion-Claude-Code), [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill), [abrahamanderson19972020/remotion-tutorial](https://github.com/abrahamanderson19972020/remotion-tutorial) | Tutorials / generic skills | not checked; generic, many near-duplicates | Ignore: duplicates of the official pack |
| `@remotion/captions` ([create-tiktok-style-captions](https://remotion.dev/docs/captions/create-tiktok-style-captions), [displaying](https://www.remotion.dev/docs/captions/displaying)) | `createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds})` returns `pages` with `text`, `startMs`, `durationMs`, per-word `tokens{fromMs,toMs}`. Safe in browser/Node/Bun. Each word text needs its leading space | FACT: since v4.0.216; `durationMs` since v4.0.261. Part of Remotion (licence below) | Yes, directly: our timeline words -> `Caption[]` -> pages -> `<Sequence>` per page, highlight current token |

Remotion licence: FACT only that a paid company licence exists and the [license page](https://www.remotion.dev/docs/license) defines who pays; thresholds not retrieved. 3P/FOLK: free for individuals and small teams. Action: read that page before monetising.

Other write-ups found (all tutorials, none about a survival channel): [openreplay](https://blog.openreplay.com/making-videos-claude-code-remotion/), [heyuan110](https://www.heyuan110.com/posts/ai/2026-01-26-claude-code-remotion-video/), [tella](https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code.md), [timewell](https://timewell.jp/en/columns/remotion-claude-code-programmatic-video). 3P, unverified: timewell claims a startup got "$5M ARR in 30 days" from one Remotion-made viral video; treat as marketing.

## 2. Why the zombie / survival format performs

Evidence is thin. Everything below is FOLK unless marked.

| Claim | Tag | Source |
|---|---|---|
| Format exists on TikTok: stick figures dropped into cinematic zombie scenarios, numbered parts, return viewers | 3P | [The Root, 2026-10-30](https://www.theroot.com/why-the-zombie-apocalypse-is-black-tiktok-s-ultimate-st-2000133293), [newengen Nov 2026](https://newengen.com/insights/tiktok-trends/) |
| Humour = stress relief about economic anxiety | 3P | The Root (editorial reading, not data) |
| Serial faceless channel: one character, daily installments; inspiration channel "Beanie Survives" 90.1K subs, 6M views, first video 6M in 12 days | 3P | [vsub.io](https://vsub.io/workspace) (vendor page, unverified) |
| Same trend name also covers "zombie love story" clips, spread from ~2026-09-27, search peak 2026-10-04 | 3P | mostly promo pages of AI generators; low trust |
| Serialisation (Part 2, Part 3) pulls binge viewing | 3P/FOLK | vsub.io; consistent with Shorts guidance |
| Hook in first frame; visual or audio beat every 2-3 s | 3P | [Shorts retention guides](https://prepublish.ai/guides/youtube-shorts-retention) (generic, no survival data) |
| Retention targets: >60% under 15 s, >50% 15-30 s, >40% 30-60 s; ~30% drop in first 5 s is normal | 3P | same family of blogs; "no official YouTube benchmark" per one of them |
| Loop ending that feeds the opening raises retention | FOLK | vendor claim, not measured |
| "Imply the horde, do not show it" keeps tension cheap | FOLK | morphic.com vendor advice |
| Comment bait = "what would you do?" twist question at end | FOLK | Kylo script structure (digest), no external confirmation |

Take-away: the format's real levers (specific situation clear in 1 s, calm contrast voice, step list, part numbers) are only evidenced via Kylo's own prompts. We have no external performance proof. Do not copy its structure; only the hook and serial-numbering are low-risk.

## 3. Failure modes and mitigations

| Failure | Tag | Mitigation | Source |
|---|---|---|---|
| Flicker from non-frame-driven animation (CSS transitions, setTimeout) | 3P (Remotion skill text) | Drive everything via `useCurrentFrame()`+`interpolate/spring`; already in Kylo digest and our lint | [mcpmarket skill listing](https://mcpmarket.com/tools/skills/remotion-video-engineering-1) |
| `backdrop-filter` blur flicker | 3P (Kylo) | Pre-blurred copy | digest |
| Demonetisation: YouTube "inauthentic content" (renamed from "repetitious content", effective 2025-07-15): mass-produced, templated, little variation, slideshows without narration; can hit the whole channel | FACT-ish: policy rename confirmed by many outlets; exact wording not published (3P) | Vary scripts and scenes, original narration/comedy, own characters; keep per-episode human editorial input; do not publish dozens of near-identical templates per day | [plagiarismtoday](https://www.plagiarismtoday.com/2025/07/08/youtube-targets-inauthentic-content/), [ppc.land](https://ppc.land/youtube-clarifies-inauthentic-content-policy-changes/), [fliki](https://fliki.ai/blog/youtube-monetization-policy-2025) |
| AI is allowed if it adds original value | 3P | same | ibid |
| Content ID claim on "free" music | 3P | YouTube Audio Library is claim-safe on YouTube only; other libraries can still be claimed if someone re-registers the track; keep source + licence record | [YouTube help](https://support.google.com/youtube/answer/3376882?hl=en), [vidIQ](https://vidiq.com/blog/post/royalty-free-music-youtube-audio-library/) |
| Whisper timestamp drift (seconds on long audio; no native per-word) | 3P | Forced alignment on clean TTS audio; short per-scene chunks | [WhisperX discussion](https://github.com/openai/whisper/discussions/684), [Fora Soft](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/whisperx-diarization-word-level-timestamps) |
| "AI slop" look; character inconsistency across shots | 3P/FOLK | Frozen rigs + character sheet: already our approach | morphic.com, Kylo |
| Takedowns / strikes for Claude-made videos specifically | none found | n/a | no source |

## 4. Improvements for our pipeline

### Subtitles
- `@remotion/captions` is the official path (FACT). Build `Caption[]` from our word timeline, one `<Sequence>` per page. Pre-add leading spaces. Tune `combineTokensWithinMilliseconds` (low = word-by-word, high = full phrase).
- Kylo styling (2 lines x 2-4 words, one coloured word, 0.94->1 pop in 120-160 ms) is a CSS-free spring on top; keep ours Cyrillic-baseline checked.

### Word alignment for Russian
We already have TTS text and audio, so the transcript is known: forced alignment, not transcription.

| Tool | Russian status | Tag | Notes |
|---|---|---|---|
| Montreal Forced Aligner | Pretrained Russian MFA dictionary v3.1.0 (`mfa model download dictionary russian_mfa`) and acoustic model v3.1.0, CC BY 4.0 | FACT (docs list) | [dictionary page](https://mfa-models.readthedocs.io/en/latest/dictionary/Russian/Russian%20MFA%20dictionary%20v3_1_0.html), [releases](https://github.com/MontrealCorpusTools/mfa-models/releases). Best bet; needs OOV/stress handling and heavy install. Not benchmarked here |
| WhisperX (wav2vec2 alignment) | Russian alignment model availability not confirmed | untested | check `ru` in WhisperX default align models before relying on it |
| faster-whisper `word_timestamps` | Works, but timestamps cross-attention-based and drift | 3P | usable as a cheap fallback; our TTS emits clean audio so error is small |
| Whisper internal aligner, CTC aligners | papers exist ([2509.09987](https://arxiv.org/pdf/2509.09987), [2606.10675](https://arxiv.org/pdf/2606.10675)); no Russian numbers | untested | read before choosing |

Test plan: one 60 s scene, hand-mark 20 word boundaries, compare MFA vs faster-whisper vs WhisperX; accept <=60 ms median error.

### SFX / music licences

| Source | Licence | Tag |
|---|---|---|
| YouTube Audio Library | claim-safe on YouTube only | 3P/FACT (help page) |
| Pixabay audio | Pixabay content licence, commercial, no attribution | 3P (verify on site) |
| Freesound | per-file: CC0 ok, CC BY needs credit, CC BY-NC unusable | 3P |
| Mixkit | free licence, commercial | 3P (not verified here) |

Rule: store per-asset source URL + licence in the episode manifest.

### Thumbnails / covers
No tool research found. Shorts covers are largely an auto-frame; keep Kylo's rule (hero large left, <=8 words, empty lower-right) as FOLK and render with a Remotion `<Still>` from the same rigs.

## Adopt / Test / Ignore

**Adopt**
- `@remotion/captions` + `createTikTokStyleCaptions`: official, small, fits our word timeline.
- `remotion-dev/skills` `best-practices` + `captions` as reference text: official, 6.4k stars, prevents flicker classes.
- Per-asset licence manifest: cheap, avoids Content ID disputes.
- Original-content discipline (vary scripts, scenes, human edit pass): the only policy mitigation with sources.

**Test**
- MFA Russian (v3.1.0) for word alignment: pretrained exists, accuracy unknown for our TTS.
- WhisperX `ru` alignment: confirm model exists, compare to MFA.
- svg-creator-skill render-look-fix loop for rig authoring only: 41 stars, 2 commits, style mismatch.
- Numbered-part serialisation and loop endings: plausible, unproven for comedy.
- Remotion `<Still>` for covers.

**Ignore**
- Blender MCP: 3D breaks flat cut paper look.
- Generic "Claude + Remotion" tutorial repos: duplicates of the official pack.
- Kylo's "23M views", Icon "$5M ARR", vsub.io numbers: unverifiable marketing.
- Zombie-love-story trend pages: promo for generators, different format.
- Piper/ElevenLabs: we have local Drama 3 voices.
