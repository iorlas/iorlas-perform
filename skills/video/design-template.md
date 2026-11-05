# video: per-scenario design sheet (template)

Copy to `<scenario>.design.md` beside the scenario; it is the human version of `<scenario>.design.json`.
Fill it **after the audio exists** (times) and **before any art**. Replace `<...>`. Example it came from: a 5-scene, 3.5 min comedy with a flashback, a call on speaker, a vehicle with an overlay chat, a wall screen and a crowd.

```
# <scenario>: scene design sheet (draft N)
Source: <scenario>.md (<scenes> scenes, ~<chars> spoken characters, ~<minutes> min, voices <list>).
Purpose: <what this scenario stresses: flashback, call inset, screen-in-screen, crowd, match cut ...>
Status: DRAFT | APPROVED (date). Nothing implemented | implemented up to <slice>.
```

## 1. What each feature is tested by
| feature | where (shot ids) |
|---|---|
| <set kinds: n sets, k non-rooms> | |
| <screen inserts / dictation> | |
| <flashback marker> | |
| <phone-call inset> | |
| <overlay chat on a prop> | |
| <match cut> | |
| <time cards> | |
| <push-in> | |
| <crowd> | |
| <narrator without a body> | |

## 2. Cast and rigs
| voice | on screen | rig `id@semver` |
|---|---|---|
| | who / what they do in this scenario | |
Not used: <rigs available but not cast>. Appears twice: <who, where>.

## 3. Overlays and inserts (separate from sets)
| overlay | where | look and rules |
|---|---|---|
Rules: fixed position and size per scene; smaller than the subject; on the side opposite his look; never over a face; slides in from an edge only over a close-up.

## 4. Signals (flashback, time jump, call)
Marker design (palette change, strip, ...) as ONE constant overlay for the whole scene; how it ends; the line that announces it aloud.

## 5. Scene N: «<title>» (ambience <x>) . Set <id> (<tier>, <status>)
One paragraph: the place, the light, what is on the table.
| shot | beat | frame | focus | on screen | cast |
|---|---|---|---|---|---|
| N.1 | narrator «...» | wide (establish only) | the place | | |
| N.2 | <speaker> «...» | medium | <speaker>, left third, looks right | | |
Required per row: **frame** (wide/medium/close/insert/inset), **focus** (one thing), **subjects** (all things the line is about, for the camera), **side**, **cast**, and for inserts the exact overlay state.
Transition out: <cut | time card «13:30» | match cut A -> B>.
Insert rules: <position/size constant; current item loud, earlier items tone-on-tone>.

(Repeat for every scene.)

## 6. Sets used
| scene | set | tier | status (approved / built / in design) |

## 7. Rig gaps and blockers
| blocker | where | workaround (and the new-rig-version it would need) |
Known ones to check for every cast member: no seated pose; no hand-on-rail / hold-phone-to-ear; no pose facing a screen; no clap / arm raise; baked-in counter slab; cannot be re-lit; Cyrillic on rig stickers garbles (text lives in the set or an overlay).

## 8. Art this needs
Time cards, end card, flashback strip, overlay modules (each with its states), props (each cited by a line), new sets (each with tier). Spare places from cut drafts go to the census, not here.

## 9. Open questions for Denis
Numbered, each with the recommended option first.
