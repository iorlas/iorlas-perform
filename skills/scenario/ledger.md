# Failure ledger

Every line a listener stumbled on, with its cause and what now catches it. A failure that
returns becomes a rule in SKILL.md and, where it can be counted, a lint check. Before writing,
read the rules this ledger produced; before a release of the skill, run the checks against the
`catch` column and keep any case nothing catches.

| # | episode | line | heard as | cause | rule | catch |
|---|---|---|---|---|---|---|
| 1 | 01-whatsapp | «как «Наполеон». Смотреть надо по слоям» | the emperor, not the cake | a reference named by half its name | T10 | ear only: no judge (GPT, Claude) picked it |
| 2 | 01-whatsapp | «И ещё один телефон: вашей маме» | nonsense: a phone inside an app | the link (the AI sent the app to Мама) left out | T11, M9 | ear only: no judge picked it |
| 3 | 01-dvenadtsat r1 | «Вадик честно посчитал Двач» | a riddle: counted it as what? | the link (his nights there as work years) left out | T11 | GPT medium and Opus, 5th-6th of 6 picks |
| 4 | 01-dvenadtsat | «Что это, она не знала.» | a question that stops halfway | statement opens with a question word | T13 | lint (question order) |
| 5 | 01-dvenadtsat | «[warning, slow] ... [beat] Хотя ты не умеешь.» | the insult voiced as more warning | punch shares the setup's tag | T14 | ear only: one tag over 3+ sentences is half of all laugh turns, too common to lint |
| 6 | 01-dvenadtsat | «Добавь... письма Палыча!» | what letters? why his? | a choice without its reason; the map's `because` left it out too | T15 | ear only so far: listen.py checks laughs, not choices |
| 7 | 01-dvenadtsat | «мой сеньор интеллект внедрил!» | «сеньор интеллект», stress on the wrong word | two nouns touch with the verb last; the boast shares the setup's tag | T13, T14 | ear only |

## The rules check on 01-dvenadtsat (after cases 4-7 were fixed)

`listen.py rules`, Opus 9 findings, GPT 18; 11 applied, the rest refused. It found more of
the same: «Мама всей парадной скажет» (T13, Opus), «На Хедхантере сеньоров брали» (T13, GPT),
«index точка html» never said what it is (T15, GPT), and 8 jabs with no delivery change (T14,
both). Refused: T14 on the deadpan narrator (6), a mother's care read as an insult, Палыч
reading the chat flat (the flat reading is the joke), a server named one line before its
neural network. Both families agreed on 6 of the 11.

## Rated short scenes: where their ledger lives

A mode keeps its own ledger of rated scenes in `modes/NAME/evidence.md` (hit rates, what the
checks caught and missed, failure causes by frequency, the lines the author rated good), and
cuts its rules, with ids, from it in `modes/NAME/mode.md`. The generic rules that came out of
those rounds are SKILL.md L1-L8 and the line check (8b); the lint cannot count them, so the
catch is the fresh reader in 8b and the author's rating. `profiles.py modes` lists the modes.
