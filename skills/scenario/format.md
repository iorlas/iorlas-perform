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
  crossfaded from the last. Every bed fades: in before the scene's first word, across into the
  next bed, out after the last word; effects (`{sfx}`) play as recorded, a phone ring starts
  at once. Give an intro or a jingle a bed too: without one its gaps drop to digital silence. Beds: `office`, `kitchen` (flat, home), `evening` (city outside),
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

## Map

`## Map` (or `## Карта`), after the cast: the story map (SKILL.md 4a), one row per node. Not read
aloud; the lint checks it. Columns are found by the header's names, so `who`, `knows` and `via`
may be left out of a short map and added later.

```
| id | kind | who | what | because | knows | via | shown |
|---|---|---|---|---|---|---|---|
| hide-dvach | want | vadik | at 10, hides from Мама that he lives on Двач | | | narration | Кухня, утро |
| first-lie | lie | vadik | «программу делаю для переписки» | hide-dvach | | room | Кухня, утро |
| at-boss | fact | vadik | tells Мама he is at the boss's | mama-calls | | phone | Кабинет, день |
| to-boss | act | mama | asks for the boss by name | pride | at-boss | phone | Кабинет, день |
| ban-debt | arc | mikhalych | banned him in 2010 | mod-past | | room | later: arcs.md, the finale |
```

| column | holds |
|---|---|
| `id` | a short name the other columns point to |
| `kind` | `want`, `fear`, `fact`, `rule` (of the world), `lie`, `act`, `choice`, `plant`, `reveal`, `turn`, `payoff`, `arc` (a season gun) |
| `who` | the voice that acts, says or learns it (a cast voice, or `narrator`); empty for a world fact |
| `what` | the node in a few words |
| `because` | ids of what causes or motivates it, comma-separated; required for lie, act, choice, reveal, turn, payoff |
| `knows` | ids of what `who` must know first; each must be heard no later |
| `via` | how it happens or reaches them: `room`, `phone`, `screen`, `chat`, `memory`, `narration` |
| `shown` | the scene heading where the listener hears it, or `later: WHERE` |

The lint reports: a reason missing or not in the map; a node shown in no scene; `later` with
no where; a cause or a known thing heard in a later scene than what it explains; a `who`
outside the cast; `via room` for someone only on the phone there; `via phone` in a scene with
no phone; a want, fact, rule or plant nothing follows from.

## Design marks

Comments the lint reads. Each goes on its own line, before the line it marks.

| mark | meaning |
|---|---|
| `<!-- beat: NAME -->` | the episode's beat starts here: hook, setup, incident, ladder (one per rung), turn, button, tag (names and order tunable per profile) |
| `<!-- plant: KEY -->` | the setup of a callback |
| `<!-- echo: KEY -->` | the callback returns, changed, between plant and payoff |
| `<!-- payoff: KEY -->` | the callback pays off; an error without a plant earlier in this file |
| `<!-- arc: KEY -->` | a season gun: planted here, fired in a later episode, listed in the profile's `arcs.md`; not checked as a callback |
| `<!-- laugh: WHAT -->` | the next line is meant to get a laugh; the lint counts them per minute and reports long gaps (J0) |
| `<!-- needs: id, id -->` | with every laugh: the map nodes the listener must already have heard for it to work; `needs: -` for none. An error when a node is not in the map, is `later`, or is heard in a later scene; a node from the same scene needs its `shows` mark on an earlier line (M9) |
| `<!-- shows: id -->` | this line tells the listener that map node; only for nodes a `needs` uses from the same scene |
| `<!-- length: 4.5 -->` | target minutes; the lint warns past ±25% |
| `<!-- lint-ok: words -->` | drops warnings containing these words: an intended exception, with the reason in a comment |
| `<!-- lint: jingle -->` | a series intro: the who-and-where and structure checks are off |

## Older format

`.txt` files, one turn per line, still render: `voice: text`, `{pause N}`, `#` comments, an
optional `@cast` block (`voice | desc` lines) and `@scene place | ambience NAME` headers.
