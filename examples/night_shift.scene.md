# Scene design: Вырезка (flat cut paper)

Friday 18:00: Vadik deploys to prod and goes home late (his mistake). Saturday 03:00: prod is red, Vadik begs it to go green, the CTO calls, Vadik lies «всё под контролем»; the narrator's punchline: the only thing under control was the cricket, which never went down.

## Set `setA_office_dusk`

| object | size (H) | place | role |
|---|---|---|---|
| `window` | 0.5x0.5 | x=-1.0, up=0.38 | Back wall, left. Dusk: orange sky. Night: dark. Carries the time of day. |
| `sill` | 0.56x0.025 | x=-1.0, up=0.36 | Window sill. Where the cricket lives (night). |
| `clock` | 0.16x0.16 | x=0.98, up=0.7 | Wall clock, right wall, above the counter. 12 numerals, hands at 18:00; the time card then jumps to 03:00. |
| `desk` (front) | 0.8x0.43 | x=0 | Vadik's desk, solid to the floor. Stands in front of him, so his lap and legs are hidden. |
| `chair` | 0.28x0.55 | x=0 | Office chair behind the desk; its back shows over his shoulders. He sits on it. |
| `keyboard` | 0.24x0.03 | x=-0.03, on=desk | Under his hands. All typing happens here. |
| `monitor` (front) | 0.3x0.2 | x=0.24, on=desk | Right of the keyboard, turned to Vadik; its screen is what he reads and what the story shows. |
| `phone` (front) | 0.13x0.06 | x=-0.3, on=desk | Desk phone base: display (caller ID, then call time), keypad. Stays on the desk. |
| `incidents` | 0.26x0.17 | x=0.98, up=0.5 | Safety counter «дней без инцидентов»: 3 at dusk, 0 at night. Setup/payoff for the whole story. |
| `poster_friday` | 0.46x0.3 | x=-0.5, up=0.52 | Left wall poster: the rule everyone breaks, with the count. Replaced by the dashboard at night. |
| `whiteboard` | 0.46x0.28 | x=0.55, up=0.66 | Whiteboard: the system diagram. Everything is deployed through one box, «Вадик»; arrow to the API is labelled «руками». |
| `handset` (front) | 0.15x0.035 | x=-0.3, on=phone | Handset on the cradle. Jiggles when it rings; Vadik lifts it (it leaves the cradle). |

Character `vadik`: seated on `chair`, base pose `stand_still`. Sits at his desk, facing us over the keyboard, reading the monitor on his right.

## Set `setB_office_night` (extends `setA_office_dusk`)

| object | size (H) | place | role |
|---|---|---|---|
| `window` | 0.5x0.5 | x=-1.0, up=0.38 | Same window, night. |
| `sill` | 0.56x0.025 | x=-1.0, up=0.36 | Window sill. Where the cricket lives (night). |
| `desk` (front) | 0.8x0.43 | x=0 | Vadik's desk, solid to the floor. Stands in front of him, so his lap and legs are hidden. |
| `chair` | 0.28x0.55 | x=0 | Office chair behind the desk; its back shows over his shoulders. He sits on it. |
| `keyboard` | 0.24x0.03 | x=-0.03, on=desk | Under his hands. All typing happens here. |
| `monitor` (front) | 0.3x0.2 | x=0.24, on=desk | Right of the keyboard, turned to Vadik; its screen is what he reads and what the story shows. |
| `phone` (front) | 0.13x0.06 | x=-0.3, on=desk | Desk phone base: display (caller ID, then call time), keypad. Stays on the desk. |
| `incidents` | 0.26x0.17 | x=0.98, up=0.5 | Safety counter «дней без инцидентов»: 3 at dusk, 0 at night. Setup/payoff for the whole story. |
| `whiteboard` | 0.46x0.28 | x=0.55, up=0.66 | Whiteboard: the system diagram. Everything is deployed through one box, «Вадик»; arrow to the API is labelled «руками». |
| `handset` (front) | 0.15x0.035 | x=-0.3, on=phone | Handset on the cradle. Jiggles when it rings; Vadik lifts it (it leaves the cradle). |
| `dashboard` | 0.5x0.3 | x=-0.5, up=0.52 | Wall dashboard in the poster's place: a PROD service list. The cricket is a row of it (setup and punchline). |
| `cricket` | 0.1x0.065 | x=-1.0, on=window, up=-0.465 | The cricket OUTSIDE, on the outer ledge, seen through the dark pane against the moon-lit sky. Chirps on the punchline. |

Character `vadik`: seated on `chair`, base pose `stand_still`. Sits at his desk, facing us over the keyboard, reading the monitor on his right.

## Set `setC_palych_home`

| object | size (H) | place | role |
|---|---|---|---|
| `armchair` | 0.5x0.55 | x=0 | His armchair at home, night. |
| `lamp` | 0.12x0.6 | x=0.4 | Floor lamp: the one warm light in a dark room. |
| `cert` | 0.3x0.2 | x=-0.45, up=0.5 | Framed certificate on his wall, crooked pride: «лучшему CTO за ночные звонки». |

Character `palych`: seated on `armchair`, base pose `hold_receiver`. Sits in the armchair, phone at his ear. Only head and shoulders are ever shown.

## Grounding: where each object comes from

| object | from |
|---|---|
| `window` | «за окном» |
| `sill` | **invented** |
| `clock` | «Шесть вечера» |
| `desk` | **invented** |
| `chair` | **invented** |
| `keyboard` | «keyboard» |
| `monitor` | «в монитор» |
| `phone` | «зазвонил телефон» |
| `incidents` | **invented** |
| `poster_friday` | **invented** |
| `whiteboard` | **invented** |
| `handset` | «зазвонил телефон» |
| `dashboard` | «красный дашборд» |
| `cricket` (outside) | «сверчок за окном» |
| `armchair` | **invented** |
| `lamp` | **invented** |
| `cert` | **invented** |

## Scene «Офис, вечер» (set `setA_office_dusk`)

Establish place, time and the plan: a calm office emptying out, one man staying to push a deploy that looks easy.

Transition out: time_card «СБ 03:00»

| shot | beats (what is heard) | frame | on screen | intent |
|---|---|---|---|---|
| 1.1 | [calm, ironic] Пятница. Офис. Шесть вечера. Все  | wide | vadik | Where and when: the clock says 18:00, Vadik stays at his desk. |
| 1.2 | [nervous, too fast] Последний деплой. Пять минут | medium | vadik | The plan: he types, the monitor shows the deploy bar racing to 99 %. |
| 1.3 | [dry] Это была его главная ошибка за неделю. | medium + push-in | vadik | The mistake: the bar freezes at 99 % with one red tile; he winces; slow push-in. |

Event map (heard -> shown, in time order):

| beat | heard | shot starts | cues and interactions that start here |
|---|---|---|---|
| 1 | narrator: [calm, ironic] Пятница. Офис. Шесть вече | 1.1 | `monitor` -> terminal; `vadik` hands_on `keyboard` |
| 2 | vadik: [nervous, too fast] Последний деплой. Пя | 1.2 | `monitor` -> deploy_run; `poster_friday` -> visible=True; `vadik` hands_on `keyboard` |
| 3 | narrator: [dry] Это была его главная ошибка за нед | 1.3 | `monitor` -> deploy_frozen; `vadik` -> wince; `vadik` hands_on `keyboard` |

Interactions:

- `vadik` looks_at `monitor` (whole scene)
- `vadik` hands_on `keyboard` (beats [1])
- `vadik` hands_on `keyboard` (beats [2]) typing
- `vadik` hands_on `keyboard` (beats [3])

Cues:

- beat 1: `monitor` -> terminal
- beat 2: `monitor` -> deploy_run
- beat 3: `monitor` -> deploy_frozen
- beat 3: `vadik` -> wince
- beat 2: `poster_friday` -> visible=True

## Scene «Офис, ночь» (set `setB_office_night`)

Same room, 03:00, lights off. Everything is red except the cricket. Vadik begs the monitor; the CTO's call forces the lie; the punchline pays off the cricket.

| shot | beats (what is heard) | frame | on screen | intent |
|---|---|---|---|---|
| 2.1 | [low voice] Ночь. Офис. Тишина. Только сверчок з | wide | vadik | Same office, now dark: dashboard rows fail one by one; the cricket sits quietly on the sill (setup). |
| 2.2 | [whisper, pleading] Ну давай. Ну пожалуйста. Зел | close | vadik | Vadik begs, lit by the monitor: red tiles, one flickers green and goes back. |
| 2.3 | sfx keyboard | insert | vadik | Typing, desperate: hands on the keys. |
| 2.4 | [dry] В три часа ночи у Вадика зазвонил телефон.; sfx phone_ring | insert | no one | The phone rings: handset jiggles, the display shows who: «Г. Палыч CTO». |
| 2.5 | [loud, suspicious question, rising intonation] В | close | palych | Intercut to the CTO at home (armchair, lamp, framed certificate), receiver at his ear, shouting; lip-synced. Film language for a phone call, no UI plate. |
| 2.5b | [loud, suspicious question, rising intonation] В | close | vadik | Cut back to Vadik with the receiver, listening, bracing for his answer. |
| 2.6 | [panicking] Потому что всё под контролем, Геннад | close | vadik | The lie: panic on his face while the monitor repeats «всё под контролем». |
| 2.7 | [dry, deadpan] Под контролем было только одно: с | insert + push-in | no one | Punchline: every service DOWN, the cricket row UP at 100 %, the cricket on the sill; push-in on «сверчок». |

Event map (heard -> shown, in time order):

| beat | heard | shot starts | cues and interactions that start here |
|---|---|---|---|
| 1 | narrator: [low voice] Ночь. Офис. Тишина. Только с | 2.1 | `dashboard` -> dash_failing; `incidents` -> text «0»; `vadik` looks_at `monitor`; `vadik` hands_on `keyboard` |
| 2 | vadik: [whisper, pleading] Ну давай. Ну пожалуй | 2.2 | `monitor` -> tiles_red |
| 3 | sfx keyboard | 2.3 | `vadik` hands_on `keyboard` |
| 4 | narrator: [dry] В три часа ночи у Вадика зазвонил  | 2.4 | `vadik` hands_on `keyboard` |
| 5 | sfx phone_ring | - | `phone` -> text «ring:ПАЛЫЧ CTO» |
| 6 | praporshchik: [loud, suspicious question, rising inton | 2.5, 2.5b+3.0s | `monitor` -> chat_control; `phone` -> text «в разговоре»; `vadik` holds `handset` |
| 7 | vadik: [panicking] Потому что всё под контролем | 2.6 | - |
| 8 | narrator: [dry, deadpan] Под контролем было только | 2.7 | `dashboard` -> dash_cricket (+2.6s); `cricket` -> text «chirp» (+2.6s) |

Interactions:

- `vadik` looks_at `monitor` (beats [1, 2, 3, 4])
- `vadik` hands_on `keyboard` (beats [1, 2])
- `vadik` hands_on `keyboard` (beats [3]) typing
- `vadik` hands_on `keyboard` (beats [4, 5])
- `vadik` holds `handset` (beats [6, 7, 8])

Cues:

- beat 1: `dashboard` -> dash_failing
- beat 2: `monitor` -> tiles_red
- beat 6: `monitor` -> chat_control
- beat 8: `dashboard` -> dash_cricket
- beat 1: `incidents` -> text «0»
- beat 5: `phone` -> text «ring:ПАЛЫЧ CTO»
- beat 6: `phone` -> text «в разговоре»
- beat 8: `cricket` -> text «chirp»

