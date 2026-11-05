# ru-comedy: evidence

What was measured and rated while the mode was built (one author's ratings, Russian IT-office
sketches, 2026-10 to 2026-11, about 20 rounds). Rules in `mode.md` are cut from this; when
a row stops being true, the rule goes. Lines quoted here are evidence only: do not reuse them.

## Hit rate (rated "good" or better, or "ok or better" where noted)

| rounds | what changed | result |
|---|---|---|
| R4 | short 2-3 line scenes, one twist | 4 of 10 good |
| R8-R11 | longer chains, punch-ups, edge turned up | 2/14, 3/14, 3/14, 1/12 good |
| R12 | comedians' personas rewrote the scenes | panel picks: 0 of 9 good (2 ok, 4 weak, 3 bad) |
| R13 | six registers (kafka, gallows, noir, deadpan, bitter irony, boss sarcasm, adult) | 8 of 11 ok or better, 1 good |
| R15 | English-first vs Russian-first pipeline | 6 of 16 ok or better; B (English-first) 4/8, A 2/8 |
| R17 | bible + card + line check + closer | 2 ok, 2 weak; after concept swap and closer fix: 1 good |

## Judges and checkers

- Absolute 0-4 scoring by persona judges: correlation with the author's ratings about 0.07.
  Calibration made scores strict, not correct.
- Forced pairwise A/B with the author's ledger: three judges picked the author's side in 74-85%
  of extreme pairs; useless for close ones.
- The judges picked the very scenes the author called senseless (3 of 3 and 2 of 3 picked
  them). They scored by "short, twist last, real" and read charitably.
- Scene-level blind readers and a fidelity scorer scored every stage of two pipelines 16 of 16:
  the scripts spelled the premise out, so context recovered the point and a badly worded line
  passed. A bad line (a boss asking «И что за лишний час?» meaning "what does each hour cost")
  went through all stages.
- Comprehension check (blind, strict), 16 known scenes: flagged 4 of 8 broken ones (a role
  reversal, an unmotivated verdict, an inverted conclusion, a motiveless email) and 2 of 8 good
  ones; missed lines that parse but are bizarre.
- Believability check (strict prompt): flagged 5 of 8 broken and 6 of 8 good. Not a gate.
- Line-by-line blind check against character sheets (bible): flagged a garbled phrase, an
  unspeakable name, two knowledge violations, a broken chain, a spike aimed at the expert. The
  one scene it left clean was rated "ok, almost good".

## Failure causes, by frequency

| cause | examples (author's words) | rule |
|---|---|---|
| Line makes no sense or has no motive | "what is this hour?", "no motivation for Vadik to check", "why is the boss asking about the backup?" | KN1, KN4, SR6 |
| Role or knowledge slip | boss asks for the budget his engineer should ask for; boss decodes «tmp» | KN1, KN6 |
| Over-compressed | "I don't get it", "you over-condensed it" | SR6 |
| Over-explained | "Vadik over-explains the joke", a speech in one line | SR7, KN7 |
| Punch is a verdict or summary | "the last line is nothing funny, it states the situation" | PN1, PN5 |
| Last line ignores the consequence | "doesn't take into account that it was removed" | PN6 |
| Weak or invented concept | "I'm not laughing; maybe the concept was bad" | CC1 |
| Unwritten phrasing | «За каждый штраф», «тмп», «допустимо», «Пока вы звоните» | SR1-SR6 |
| Cruelty or edge aimed at a person | "too harsh", "aggressive, no humour" | EM1, EM5, KN8 |
| Polishing a liked line | liked line rated lower after rewrite (R10→R11, 6g, 6f) | TS2 |
| Fix replaced the liked punch | the laptop line replaced by a weak one when only «Тогда» was missing | TS2 |

## Lines the author rated good (evidence of the target)

- «Тогда отправим клиентам твой ноутбук.» (literalise; the missing link was «Тогда»)
- «Данных нет. Бэкапа нет. (пауза) Зато безопасность у нас идеальная: взламывать нечего.» (flip the spin, tag pivot)
- Boss: «Мне пятьдесят два. Двадцать из них я пытаюсь понять, что такое облако.» (a tired, self-aware layman)
- «Работы стоят, пока мы разговариваем» → «Тогда зачем ты со мной разговариваешь?!» (stubborn authority; cause in the room)
- A password stored in the wiki that is stored on the server.
- Boss's brutal one word: «Был.»
