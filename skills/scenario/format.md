# Scenario file format

A scenario is a Markdown file, `NN-slug.md`, that reads as a script on GitHub or in any editor.
`scripts/scenario.py` parses and lints it; `scripts/scene.py` renders it.

```markdown
# Чердак

<!-- length: 3 -->

## Cast

| voice | who |
|---|---|
| girl | Маша, внучка, десять лет |
| starik | Дед Егор, бывший моряк |

## Чердак, вечер

> ambience night

<!-- beat: hook -->
- narrator: [calm, storyteller] Вечер. Чердак. Маша нашла коробку, которую дед велел не трогать.
<!-- plant: компас -->
- girl: [excited, rising intonation] Дедушка, а это что за компас? Он показывает не на север!
- starik@0.3: [sigh, low] Он показывает туда, где я что-то потерял.
- {sfx door_open}
- starik@-0.5: [warm, quiet] Положи. Я сам открою, когда время придёт.
```

## Blocks

- `# Title`, read by nobody: the narrator says the title if the episode needs it.
- `## Cast`: a table of every voice except `narrator`, `voice | Имя, кто это`. The voice is
  the voice file's name. The words before the first comma are the names the lint looks for
  in the text, as whole words with a case ending (Маша, Машу, Маш).
- Every other `## heading` is a scene, titled with place and time. The renderer adds a scene
  pause before it. The heading is never read aloud, so the narrator still says where and when.
- `> ambience NAME [volume]` under a scene heading: the background bed for that scene,
  crossfaded from the last. Beds: `office`, `kitchen` (flat, home), `evening` (city outside),
  `night`, `rain` (street, courtyard), `wind`. `> ambience night 0.5` is half volume. A scene
  without one fades the bed out.
- Notes for the writer go in `<!-- comments -->` or plain paragraphs; only list items are read
  aloud. A turn written outside a list is an error, so no line goes missing.

## List items

- `- voice: [delivery tag] Текст`: a turn. Tags in English, anywhere in the line, to change the
  delivery mid-phrase (see the voice skill's tag guide). Russian inside brackets is read aloud.
- `- voice@0.2: ...`: the gap before this turn in seconds, instead of `--gap`. A negative gap
  starts the turn before the previous one ends, mixed over it.
- `- voice+phone: ...`: the turn heard through a phone.
- `- {pause N}`: N seconds of silence, at most 3.
- `- {ambience NAME [volume]}`, `- {ambience off}`: change the bed inside a scene.
- `- {sfx NAME [volume] [@gap]}`: a sound effect after the previous turn, spaced like a turn;
  the next turn waits for it. `- {sfx modem 0.6 @-1.5}` is 60% volume, starting 1.5 s before
  the previous turn ends. A turn spoken over the effect gets a negative gap. Effects:
  `phone_ring`, `phone_vibrate`, `modem`, `door_open`, `door_close`, `door_knock`, `keyboard`,
  `notify`, `uh_oh` (ICQ-style), `call_join` (someone joins a call), `lighter`, `kettle`,
  `cash_register`, `error_beep`. A line that promises a sound («звонит телефон») gets one;
  one or two effects per scene is plenty.

## Design marks

Comments the lint reads. Each goes on its own line, before the line it marks.

| mark | meaning |
|---|---|
| `<!-- beat: NAME -->` | the episode's beat starts here: hook, setup, incident, ladder (one per rung), turn, button, tag (names and order tunable per profile) |
| `<!-- plant: KEY -->` | the setup of a callback |
| `<!-- echo: KEY -->` | the callback returns, changed, between plant and payoff |
| `<!-- payoff: KEY -->` | the callback pays off; an error without a plant earlier in this file |
| `<!-- length: 4.5 -->` | target minutes; the lint warns past ±25% |
| `<!-- lint-ok: words -->` | drops warnings containing these words: an intended exception, with the reason in a comment |
| `<!-- lint: jingle -->` | a series intro: the who-and-where and structure checks are off |

## Older format

`.txt` files, one turn per line, still render: `voice: text`, `{pause N}`, `#` comments, an
optional `@cast` block (`voice | desc` lines) and `@scene place | ambience NAME` headers.
