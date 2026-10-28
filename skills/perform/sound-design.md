# Sound design for narrated audio drama: research notes

Sourced and assumed sound-design numbers behind scene.py's mix, gathered 2026-10-28. Open
questions are beads (`bd list -l sound`).

Sources are linked inline. Anything without a source is marked [assumption]. Several requested sources were not reachable or not found: BBC Academy mix guide, Sound On Sound, "The Audio Drama Production Podcast", "Sound Design for Audio Drama", Fiction Podcast Weekly. Their content is absent below.

## 1. Delivery loudness

- Apple Podcasts: integrated about -16 LKFS, +/-1 dB tolerance; true peak at or below -1 dBFS; measured per ITU-R BS.1770-5; preconditioning before encoding. Source: https://podcasters.apple.com/support/audio-requirements
- Spotify: normalizes to -14 LUFS at playback, not at upload; keep true peak below -1 dBTP. Source: https://support.spotify.com/au/artists/article/loudness-normalization/
- Descript: podcast standard -16 LUFS stereo, -19 LUFS mono; peak ceiling -1 dB. Source: https://www.descript.com/blog/article/podcast-loudness-standard-getting-the-right-volume
- EBU R128 programme target is -23 LUFS, but this is broadcast, not podcast. Source: https://tech.ebu.ch/publications/r128
- Practical target: -16 LUFS integrated, true peak -1 dBTP. Spotify then raises the file by about 2 dB [assumption that the gain is applied as stated; the Spotify page confirms playback normalization].
- Mono vs stereo: Apple rejects single-channel WAV/FLAC; Descript's -19 mono figure implies a separate mono target.

## 2. Levels under speech

- Music sits 6-10 dB under dialogue; ambience sits -18 to -12 LUFS relative to dialogue. Secondary source, a video-focused vendor blog: https://krotos.studio/blog/what-is-sound-design-in-video-editing
- iZotope fiction-podcast engineers give no numeric ratios. They keep narration at about -16 and say effects should be "in proportion" to the story. Source: https://www.izotope.com/en/learn/11-tips-for-mixing-and-sound-designing-a-fiction-podcast
- Ducking depth under speech: no sourced figure. [assumption] -6 to -12 dB on the bed while a line plays, recovering over about 0.5 s after the line.
- Sound effects under speech: [assumption] peaks 3-6 dB below the narrator, never masking consonants.
- Pauses: AAFT advises leaving pauses alone rather than filling every gap. Source: https://aaft.com/blog/music/sound-design-tips-for-podcast/

## 3. Transitions

- Segue: one element stops as the next starts. Crossfade: they overlap. Source: https://greatnorthernaudio.com/sfx_outline.html
- Ambience crossfade at scene change: [assumption] 1-2 s overlap. A texture change (room tone, distance) can mark the change without music. Source for texture-as-signal: same greatnorthernaudio page.
- Episode open and close fades: [assumption] fade the bed in over 1-2 s from silence; fade out over 2-3 s at the end.

## 4. Effect timing

- Place sound on the cue, not the word. [assumption] Start the effect 100-200 ms before the cue word, or on the line's pause.
- Do not cover words: duck the bed under speech (section 2), and never place an effect on top of a line that carries information. [assumption]
- Build effects from multiple layers (a door is several clicks plus a creak). Source: https://greatnorthernaudio.com/sfx_outline.html
- Limit effects so they do not pull attention from the story. Source: same page.
- Editing order: place Foley and spot effects first, then the ambient bed. Source: https://bird-onion-9lse.squarespace.com/blog/audio-triage-editing-ethos-or-15-easy-steps-to-sound-design-for-a-narrative-podcast (secondary, undated).

## 5. Voices

- Telephone effect: band-pass 300-3400 Hz (narrow-band telephone). Source: https://voxbooster.com/blog/telephone-voice-effect (vendor blog). Adobe Audition's FFT preset uses 400 Hz-4 kHz. Filter slopes of 12-24 dB/oct are a secondary-source suggestion.
- Distance/behind-wall: "take away top-end" for behind-a-wall; "increased reflection and decreased level" for distant sounds. Source: https://www.izotope.com/en/learn/11-tips-for-mixing-and-sound-designing-a-fiction-podcast
- Matching voices across characters: no sourced figure. [assumption] match each voice to within 1 dB of narrator LUFS over a short window, and keep the same EQ chain for a character across episodes.

## 6. Intros and stingers

- No sourced numbers. [assumption] Opening sequence 15-30 s, music up to full level, then duck under the narrator.
- Closing sting: 3-5 s, placed after the final narration line with a 0.5-1 s gap.
- Level jump: [assumption] the sting peaks about 2-3 dB above the episode average, then returns to narration level.

## 7. Common mistakes and fixes

- Narration unclear: keep narration the loudest element; duck the bed under it. Source for "narration first": https://www.izotope.com/en/learn/11-tips-for-mixing-and-sound-designing-a-fiction-podcast
- Loudness varies between episodes: match each episode to the previous one. Same iZotope source.
- Too many effects: cut to two or three per scene. Source: greatnorthernaudio.
- Scene changes unsignalled: mark each change with a voice, music or texture shift. Source: https://ruyasonic.com/wrt_time_transitions.htm
- Scenes built before voice files are final: lock dialogue first. Source: https://www.descript.com/blog/article/how-to-get-the-most-out-of-your-podcasts-sound-designer
- Stereo/mono mismatch: export the target format; Apple rejects mono WAV. Source: Apple page above.

## 8. Checklist before publishing

1. Integrated loudness is -16 LUFS (+/-1).
2. True peak is at or below -1 dBTP.
3. Mono and stereo exports both checked.
4. Loudness matches the previous episode.
5. Narration is the loudest element in every scene.
6. Bed ducks under every line by the set amount.
7. No effect covers a word that carries information.
8. Each scene change has a signal (voice, music or texture).
9. Ambience crossfades complete within the set time.
10. Episode opens with a fade-in and ends with a fade-out.
11. Intro and sting levels do not jump beyond the set amount.
12. Telephone and distance effects match the character's EQ setting.
13. Pauses are left in place, not filled with music.
14. Files named and exported in the platform's required format.
