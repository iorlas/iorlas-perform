# ru-comedy: worked example

One scene taken through the mode's route (`mode.md` PR), with the real defects each step
caught. The world here (an engineer and a boss at a small software company) is an example of a
bible; a real series keeps its world in its profile.

## The bible, abridged

- Company: B2B subscription software, ~120 employees, ~400 business clients, 99.9% availability
  in the contract. Production is one cluster and one database; the wiki, the mail server and the
  password manager run on the same servers. Staging has been broken since January.
- **The boss (54):** came from sales and finance; learned the vocabulary (cloud, backup, uptime,
  SLA) and not the insides. Wants blame, cost, duration, what to tell the owner. KNOWS: the
  contract numbers, bills, who is on holiday, that clients complain. DOES NOT KNOW: where
  anything is stored, what runs on what. Asks: what happened, who did this, how long, what do
  we owe, what do I tell the owner, is there a backup. Never admits fault.
- **The engineer (38):** only person who understands production; mortgage; afraid of being
  fired tonight. Answers the question asked, 3 to 12 words, in pieces; technically accurate and
  defensive; never cheeky; not stupid.

## The card (C3)

Friday 23:30, the client database is corrupted. The boss knows the word "backup", not where it
is. The engineer put the only backup in a folder called tmp "for a couple of days"; last night,
short of disk, he emptied tmp. Beats: boss orders a restore → engineer: the backup was in the
temporary folder → why → so nobody would touch it → where is the folder → I emptied it → the
backup is gone → the turn.

## Defects the checks caught, in order

1. First scene-level readers: all clear. The line check then flagged: «в тмп» cannot be said or
   heard (SR5); the boss decodes "tmp" and knows it is emptied (KN1); the final line tangled
   (SR7, PN4). Fixed: «во временной папке», the boss asks «Во временной? Почему?» and «И где
   теперь эта папка?».
2. The author: the closer «Хорошо спрятал. Даже от себя.» ignores that the data is gone (PN6).
   Fixed: the boss reacts to the loss first.
3. The author: logical now, not funny (PN8). Fixed: a stand-up closer with a tag pivot.

## Final script

*Пятница, 23:30. Босс звонит из дома. Вадик в офисе, база клиентов выдаёт ошибки.*

- boss: [громко] База клиентов упала. Восстанавливай из бэкапа. Быстро.
- vadik: [пауза] Геннадий Палыч... бэкап лежал во временной папке.
- boss: Во временной? Почему?
- vadik: Чтобы никто не трогал. Туда же никто не лезет.
- boss: [тихо] И где теперь эта папка?
- vadik: [пауза] Я её вчера почистил. Места не было.
- boss: [тихо] То есть бэкапа нет.
- vadik: Нет.
- boss: [холодно, ровно] Данных нет. Бэкапа нет. (пауза) [саркастично, с наигранным воодушевлением] Зато безопасность у нас идеальная: взламывать нечего.

Rated "lands" by the author.

## Where the same pipeline did not rescue a scene

An earlier scene (a penalty bigger than the company, "so the clients take the night shifts")
passed every check and stayed unfunny: the concept was invented hyperbole (CC1, CC2). It was
replaced by another concept (a recovery drill that existed only on paper).
