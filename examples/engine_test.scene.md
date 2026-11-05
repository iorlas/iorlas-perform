# Scene design: Вырезка (flat cut paper); per-shot looks «Гори» (hatch) and «Спичечная этикетка» (label card)

Morning, Мама feeds Вадик and he lies «тимлид по качеству». Office: 14 red tests, the AI offers to delete the tests folder, he agrees, all green («100 % от нуля»). Meeting room: Палыч is delighted, makes him the lead for real, Мама calls, he tells her the truth by accident.

## Set `setA_kitchen_morning`

| object | size (H) | place | role |
|---|---|---|---|
| `window` | 0.4x0.4 | x=-1.0, up=0.38 | Morning window over the counter. |
| `stove` | 0.34x0.42 | x=-0.6 | Stove; Мама cooks here. |
| `kettle` | 0.08x0.07 | x=-0.6, on=stove | Kettle: the steam of the morning. |
| `poster_eat` | 0.34x0.15 | x=-0.6, up=0.66 | Wall sign over the stove: the kitchen's only law. |
| `table` (front) | 0.8x0.36 | x=0.45 | Kitchen table, solid to the floor: Вадик's lap and legs are behind it. |
| `chair` | 0.28x0.55 | x=0.45 | Kitchen chair behind the table; he sits on it. |
| `plate_cutlets` (front) | 0.3x0.11 | x=0.3, on=table | Plate with 14 cutlets in a 7x2 grid (the match-cut partner of the 7x2 test tiles). State via text cue: 14 / 13 / 13f (a fork lifts the last one). |

Character `mama`: stands, base pose `stir_hold`. Stands at the stove stirring, turned to the table.

Character `vadik`: seated on `chair`, base pose `stand_still`. Sits at the table, mouth full.

## Set `setB_office_day`

| object | size (H) | place | role |
|---|---|---|---|
| `window` | 0.4x0.4 | x=-1.0, up=0.38 | Daylight window. |
| `clock` | 0.16x0.16 | x=0.98, up=0.7 | Wall clock: 14:40. |
| `poster_deadline` | 0.42x0.18 | x=-0.45, up=0.6 | Poster over the window wall. |
| `desk` (front) | 0.8x0.43 | x=0 | Vadik's desk, solid to the floor. |
| `chair` | 0.28x0.55 | x=0 | Office chair behind the desk. |
| `keyboard` | 0.24x0.03 | x=-0.03, on=desk | Under his hands. |
| `zinaida` (front) | 0.32x0.26 | x=0.24, on=desk | Зинаида, the old CRT server-computer, as Вадик's screen. Placeholder box with a screen: the zinaida rig draws its own screen states and cannot show custom content (see blockers). |

Character `vadik`: seated on `chair`, base pose `stand_still`. At his desk, facing the CRT.

## Set `setC_meeting_room`

| object | size (H) | place | role |
|---|---|---|---|
| `wallscreen` | 0.55x0.34 | x=0.7, up=0.5 | Wall screen with the dashboard (CI, all green). |
| `clock` | 0.14x0.14 | x=-0.2, up=1.02 | Wall clock: 15:00. |
| `sign_rules` | 0.46x0.13 | x=-0.8, up=1.0 | Meeting-room motto. |
| `table` (front) | 1.5x0.36 | x=-0.55 | Long meeting table, solid to the floor: legs of all three behind it. |
| `chair_end` | 0.28x0.55 | x=-0.1 | Chair at the far end of the table: Вадик's. |
| `phone` (front) | 0.13x0.06 | x=-0.3, on=table | Phone on the table: shakes when Мама calls, display МАМА. |

Character `palych`: stands, base pose `stand_still`. Head of the table, behind it, pointing at the screen.

Character `kristina`: stands, base pose `stand_still`. At his side, phone in hand.

Character `vadik`: seated on `chair_end`, base pose `stand_still`. At the far end of the table.

## Grounding: where each object comes from

| object | from |
|---|---|
| `window` | «утро» |
| `stove` | «Кухня» |
| `kettle` | **invented** |
| `poster_eat` | **invented** |
| `table` | **invented** |
| `chair` | **invented** |
| `plate_cutlets` | «котлету» |
| `clock` | «без двадцати три» |
| `poster_deadline` | **invented** |
| `desk` | **invented** |
| `keyboard` | **invented** |
| `zinaida` | «по имени Зинаида» |
| `wallscreen` | «дашборд» |
| `sign_rules` | **invented** |
| `chair_end` | **invented** |
| `phone` | «зазвонил телефон» |

## Scene «Кухня, утро» (set `setA_kitchen_morning`)

Morning kitchen: Мама feeds, Вадик lies; the plate's 14 cutlets become the 14 test tiles.

Transition out: match_cut «»

| shot | beats (what is heard) | frame | on screen | intent |
|---|---|---|---|---|
| 1.1 | [calm, ironic] Утро. Кухня. Мама кормит Вадика т | wide | mama, vadik | Establish: stove, table, the plate; Мама and Вадик. |
| 1.2 | [warm, loud] Сына, ешь! Я тёте Люде сказала, что | medium | mama, vadik | Мама asks, spatula energy; warm then curious. |
| 1.3 | [mumbling, mouth full] Ну... тимлидом. По качест | close | vadik | Mouth full, eyes sideways: the lie. |
| 1.4 | [proud, delighted] По качеству! Люда лопнет от з | close | mama | Мама proud, delighted. |
| 1.5 | [dry] Должность Вадик придумал за то время, что  | insert | no one | Insert on the plate: 13 cutlets and a fork lifting the last, laid out as a 7x2 grid for the match cut. |

Event map (heard -> shown, in time order):

| beat | heard | shot starts | cues and interactions that start here |
|---|---|---|---|
| 1 | narrator: [calm, ironic] Утро. Кухня. Мама кормит  | 1.1 | `plate_cutlets` -> text «14» |
| 2 | mama: [warm, loud] Сына, ешь! Я тёте Люде сказ | 1.2 | - |
| 3 | vadik: [mumbling, mouth full] Ну... тимлидом. П | 1.3 | `plate_cutlets` -> text «13» |
| 4 | mama: [proud, delighted] По качеству! Люда лоп | 1.4 | - |
| 5 | narrator: [dry] Должность Вадик придумал за то вре | 1.5 | `plate_cutlets` -> text «13f» |

Interactions:


Cues:

- beat 1: `plate_cutlets` -> text «14»
- beat 3: `plate_cutlets` -> text «13»
- beat 5: `plate_cutlets` -> text «13f»

## Scene «Офис, день» (set `setB_office_day`)

Office, 14:40. The AI offers to delete the tests; all goes green; «100 % от нуля».

Transition out: time_card «15:00»

| shot | beats (what is heard) | frame | on screen | intent |
|---|---|---|---|---|
| 2.1 | [dry, deadpan] Офис. Без двадцати три. В три пок | wide | vadik | Match cut from the plate: starts framed on the 14 red tiles where the cutlets were, pulls out to the whole office; clock 14:40. |
| 2.2 | [whisper, desperate] Починим тесты. Любой ценой. | medium | vadik | Whispered plea; the CRT shows the chat window with his line. |
| 2.3 | [dry] Нейросеть, которая живёт в старом сервере ; [cheerful, polite] Вы абсолютно правы! [polite,  | insert | no one | Insert on the CRT: the AI's smiley («Вы абсолютно правы!»). |
| 2.4 | sfx notify; [panicking, whisper] Да! Нет! Подожди... [pause] | medium | vadik | Panic shot in the «Гори» hatch look; the dialog pings, the cursor hovers Нет and clicks Да. |
| 2.5 | [cheerful, proud] Готово! Падающих тестов ноль.  | insert | no one | The tiles go green one by one; «0 failed · coverage 100 %». |
| 2.6 | [dry, flat] Сто процентов считалось от нуля. | insert | no one | «Спичечная этикетка» card for the narrator's line, 1.5 s. |
| 2.6b | [dry, flat] Сто процентов считалось от нуля. | insert | no one | Back to «Вырезка»: the green screen holds, the framing the next scene matches. |

Event map (heard -> shown, in time order):

| beat | heard | shot starts | cues and interactions that start here |
|---|---|---|---|
| 1 | narrator: [dry, deadpan] Офис. Без двадцати три. В | 2.1 | `zinaida` -> tiles_14_red |
| 2 | vadik: [whisper, desperate] Починим тесты. Любо | 2.2 | `zinaida` -> chat_user |
| 3 | narrator: [dry] Нейросеть, которая живёт в старом  | 2.3 | - |
| 4 | ai: [cheerful, polite] Вы абсолютно правы! [ | - | `zinaida` -> ai_smiley |
| 5 | sfx notify | 2.4 | `zinaida` -> dialog_delete |
| 6 | vadik: [panicking, whisper] Да! Нет! Подожди... | - | - |
| 7 | ai: [cheerful, proud] Готово! Падающих тесто | 2.5 | `zinaida` -> tiles_14_green |
| 8 | narrator: [dry, flat] Сто процентов считалось от н | 2.6, 2.6b+1.6s | - |

Interactions:

- `vadik` looks_at `zinaida` (whole scene)
- `vadik` hands_on `keyboard` (whole scene)

Cues:

- beat 1: `zinaida` -> tiles_14_red
- beat 2: `zinaida` -> chat_user
- beat 4: `zinaida` -> ai_smiley
- beat 5: `zinaida` -> dialog_delete
- beat 7: `zinaida` -> tiles_14_green

## Scene «Переговорка, три часа» (set `setC_meeting_room`)

Meeting room, 15:00: green dashboard, the folder with the tests is struck out and gone; Палыч promotes him; Мама calls.

| shot | beats (what is heard) | frame | on screen | intent |
|---|---|---|---|---|
| 3.1 | [dry] Переговорка. Три часа. Палыч пришёл смотре | wide | palych, kristina, vadik | Establish: all three, the wall screen green. |
| 3.2 | [loud, proud] Так. Дашборд зелёный. Падающих нол; [upspeak, trendy] Это база, Геннадий Палыч, то е | medium | palych, kristina, vadik | Two-shot: Палыч points at the screen; Кристина upspeaks, phone in hand. |
| 3.3 | [forced calm, slightly too high] Устранил первоп | close + push-in | vadik | Push-in on Вадик: forced calm. |
| 3.4 | [dry, flat] Первопричиной были тесты. | insert | no one | Wall screen: the «tests» folder is struck out, then gone. |
| 3.5 | [booming, delighted] Вадим! С сегодняшнего дня т | medium | palych, kristina | Палыч booming, delighted; Кристина beside him. |
| 3.6 | sfx phone_ring; [dry] В переговорке зазвонил телефон. Звонила ма | medium | vadik | The phone on the table shakes: Мама. |
| 3.7 | [loud, excited] Сына! Я Люде сказала, что ты тим | medium | vadik + inset `caller`: mama | Inset: Мама from the kitchen set in a rounded frame beside Вадик. |
| 3.8 | [dazed, quiet] ...Да, мам. С сегодняшнего. | close | vadik + inset `caller`: mama | Dazed; the inset stays. |
| 3.9 | [dry, deadpan] Впервые за двенадцать лет, которы | wide | palych, kristina, vadik | Pull-out to the whole room; the inset is gone. |
| 3.10 | [dry, deadpan] Впервые за двенадцать лет, которы | insert | no one | End card in the «Спичечная этикетка» look. |

Event map (heard -> shown, in time order):

| beat | heard | shot starts | cues and interactions that start here |
|---|---|---|---|
| 1 | narrator: [dry] Переговорка. Три часа. Палыч пришё | 3.1 | `wallscreen` -> wall_green; `phone` -> text «15:00» |
| 2 | palych: [loud, proud] Так. Дашборд зелёный. Пада | 3.2 | `palych` -> visible=None |
| 3 | kristina: [upspeak, trendy] Это база, Геннадий Пал | - | - |
| 4 | vadik: [forced calm, slightly too high] Устрани | 3.3 | `palych` -> visible=None |
| 5 | narrator: [dry, flat] Первопричиной были тесты. | 3.4 | `wallscreen` -> desktop_tests |
| 6 | palych: [booming, delighted] Вадим! С сегодняшне | 3.5 | - |
| 7 | sfx phone_ring | 3.6 | `phone` -> text «ring:МАМА» |
| 8 | narrator: [dry] В переговорке зазвонил телефон. Зв | - | - |
| 9 | mama: [loud, excited] Сына! Я Люде сказала, чт | 3.7 | `phone` -> text «разговор» |
| 10 | vadik: [dazed, quiet] ...Да, мам. С сегодняшнег | 3.8 | - |
| 11 | narrator: [dry, deadpan] Впервые за двенадцать лет | 3.9, 3.10+4.5s | - |

Interactions:


Cues:

- beat 1: `wallscreen` -> wall_green
- beat 5: `wallscreen` -> desktop_tests
- beat 2: `palych` -> visible=None
- beat 4: `palych` -> visible=None
- beat 1: `phone` -> text «15:00»
- beat 7: `phone` -> text «ring:МАМА»
- beat 9: `phone` -> text «разговор»

