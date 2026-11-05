# Сеньор Вадик. Правила проекта

<!-- length: 3.5 -->

<!-- Written 2026-11-05 as the set-census stress scenario. Cut to one game and ~3 minutes on the decision of Denis's delegate; earlier versions (market, can bribe, paper copies, unplug subplot) are in the session scratchpad.

CARD
- Place/time: Thursday 5 Nov. Kitchen noon -> marshrutka 13:30 -> meeting room 14:00 -> Moscow 15:10. Flashback: server room, night of 29 Oct (the AI plays the record).
- Wants: Вадик wants the file of «project rules» deleted before 14:00 (it holds his true self). Палыч wants to look open to the owners from Moscow: «показываем всё, мне скрывать нечего». Мама wants her son fed at two.
- Knows at start: Вадик knows what the file says; Палыч does not; the AI obeys every line, literally.
- Order of facts: the order to show it -> the AI refuses to delete (his own rule three) and plays the record: lie only about experience; Мама's call is answered; nobody edits; the curse at Палыч -> he asks the AI to lie (rule one forbids) -> the file goes on the wall, Палыч reads it aloud -> rule two: Мама on speaker -> Палыч reads the curse at himself -> the owners adopt the file as the code.
- Turn owner: Палыч, reading, in front of the owners, the line that sends him to hell: «Мне скрывать нечего».

Game: Вадик's own night dictation binds him: every rule is obeyed to the letter by the AI, by Палыч and by the owners.

Concept test (CC1): «Вадик ночью после корпоратива надиктовал ИИ правила проекта; Палыч покажет их собственникам вслух; ИИ не даёт удалить файл по его же правилу; собственники принимают всё как кодекс.» Plausible, a stinger on both men, clear without jargon.

Spice: the curse at Палыч, read by Палыч in front of his owners. Quiet beat: «Я обычно не занят». -->

<!-- lint-ok: merge scenes -->
<!-- lint-ok: dialogue sentences are 1-3 words -->
<!-- lint-ok: dialogue sentences are 10+ words -->
<!-- lint-ok: payoff -->
<!-- lint-ok: beat «setup» -->
<!-- lint-ok: beat «incident» -->
<!-- lint-ok: beat «turn» -->

## Cast

| voice | who |
|---|---|
| vadik | Вадик, 28, фальшивый сеньор |
| palych | Палыч, IT-директор, бывший начальник армейского склада |
| mama | Мама Вадика |
| ai | Нейросеть в старом сервере Зинаида |

## Map

| id | kind | who | what | because | knows | via | shown |
|---|---|---|---|---|---|---|---|
| twelve | fact | narrator | Вадик has twelve years of experience on paper, invented | | | narration | Кухня, полдень |
| mama-lunch | want | mama | Мама will call at two to check he eats | | | room | Кухня, полдень |
| palych-open | want | palych | Палыч wants to look open to the Moscow owners: show everything, nothing to hide | | | phone | Кухня, полдень |
| order | act | palych | the commission at two, the rules file on the screen and aloud | palych-open, twelve | | phone | Кухня, полдень |
| fear-file | fear | vadik | the file holds his true self; he wants it gone | order | order | phone | Кухня, полдень |
| delete-ask | act | vadik | asks the AI to delete the file | fear-file | order | phone | Кухня, полдень |
| rule-lock | rule | vadik | the rules are never changed, not even by him, least of all when he begs | | | phone | Кухня, полдень |
| refuse | act | ai | refuses to delete: rule three | rule-lock, delete-ask | rule-lock | phone | Кухня, полдень |
| rules-file | fact | ai | the agent takes project rules down from his dictation | | | narration | Серверная, ночь |
| morning-panic | fear | vadik | in the morning he panics and rewrites everything | | | room | Серверная, ночь |
| ai-asks | act | ai | takes down the dictation word for word | rules-file | | room | Серверная, ночь |
| rule-lie | rule | vadik | lie only about experience, otherwise honest | ai-asks | | room | Серверная, ночь |
| rule-mama | rule | vadik | when Мама calls, pick up, whatever happens | ai-asks | | room | Серверная, ночь |
| dictate-lock | act | vadik | dictates rule three: no edits, not even by him | morning-panic, ai-asks | | room | Серверная, ночь |
| tushonka | fact | narrator | the корпоратив prize from Палыч was a can of tushonka | | | narration | Серверная, ночь |
| curse | fact | vadik | recorded: Палыч can go to hell with his tushonka | ai-asks, tushonka | | room | Серверная, ночь |
| ask-lie | act | vadik | asks the AI to tell Палыч the file is broken | fear-file | rule-lie | room | Маршрутка, день |
| honest | act | ai | refuses to lie about the file | rule-lie, ask-lie | rule-lie | room | Маршрутка, день |
| show-file | act | ai | puts the file on the wall for Палыч to read | order, honest | order | screen | Переговорная, ровно два |
| read-file | act | palych | reads the rules aloud from the wall | show-file, palych-open | order | room | Переговорная, ровно два |
| call-rule | act | palych | orders Вадик to pick up Мама's call on speaker | read-file, rule-mama | rule-mama | room | Переговорная, ровно два |
| read-curse | turn | palych | reads the curse at himself and says «скрывать нечего» | read-file, curse, palych-open | curse | room | Переговорная, ровно два |
| code | payoff | palych | the owners make the rules the code of conduct | read-curse | read-curse | narration | Москва, сорок второй этаж |
| everyone-lies | payoff | narrator | all forty fill in twelve years; Вадик writes thirteen | code, twelve | code | narration | Москва, сорок второй этаж |

## Кухня, полдень

> ambience kitchen

<!-- beat: hook -->
<!-- laugh: working remotely means sitting in the kitchen -->
<!-- needs: - -->
<!-- shows: twelve -->
- narrator: [dry, deadpan] Четверг, полдень. Мама жарила котлеты, Вадик работал удалённо, то есть сидел на кухне в наушниках. Палыч прислал голосовое. В резюме у Вадика стояло двенадцать лет опыта, которых не было.
<!-- plant: в два -->
- mama: [warm, loud] Сына, ешь! В два позвоню, проверю.
<!-- beat: setup -->
- {sfx notify}
<!-- laugh: nothing to hide, said by a man who has not read the file -->
<!-- needs: twelve -->
- palych+phone: [loud, commanding] Вадим! В два комиссия из Москвы. Показываем всё! Мне скрывать нечего. Файл с правилами нейросети — на экран и вслух!
<!-- beat: incident -->
- vadik@0.3: [whispering, panic] Нейросеть, файл с правилами проекта. Удали. Срочно.
<!-- beat: ladder -->
<!-- laugh: the agent refuses by quoting his own rule -->
<!-- needs: - -->
<!-- shows: rule-lock -->
- ai@0.3: [polite, cheerful] Правило три: правила не менять. Никому. Даже вам, если вы будете просить.
- vadik@0.2: [desperate whisper] Я прошу!
<!-- laugh: the rule loop: asking makes it certain -->
<!-- needs: rule-lock -->
- ai@0.2: [sweet, pleased] Особенно если будете просить. Это ваши слова. Воспроизвожу запись от двадцать девятого октября.

## Серверная, ночь

> ambience night

<!-- beat: ladder -->
<!-- shows: rules-file, tushonka -->
- narrator: [dry, deadpan] Три часа ночи, серверная. Вадик, после корпоратива, диктовал Нейросети правила проекта. Палыч как раз вручил ему на корпоративе премию: банку тушёнки.
<!-- laugh: the code of honour of a liar -->
<!-- needs: - -->
<!-- shows: rule-lie -->
- vadik@0.3: [slurred, tired, loud whisper] Так. Записывай. Правило раз. Врать — только про опыт. В остальном — честно. [proud] Я же не лгун какой-нибудь.
<!-- shows: rule-mama -->
- vadik@0.5: [slow, quiet] Правило два. Если звонит Мама — бери трубку, что бы ни было. Даже если я скажу, что занят. [barely audible] Я обычно не занят.
<!-- laugh: he locks himself out and knows himself -->
<!-- needs: - -->
<!-- shows: morning-panic -->
- vadik@0.5: [slurred, firm] Правило три. Правила не менять. Никому. Даже мне, если я утром буду просить. Особенно если буду просить. Утром я паникую.
<!-- shows: curse -->
- vadik@0.4: [slurred, sour, loud] И последнее. Палыч пусть идёт на хуй со своей тушёнкой.
- ai@0.3: [polite] Записала. Правило четыре.

## Маршрутка, день

> ambience rain

<!-- beat: ladder -->
- narrator: [dry, deadpan] Маршрутка, дождь, давка. Вадик висел на поручне и шептал в наушник.
- vadik@0.3: [whispering, urgent] Скажи Палычу, что файл повреждён!
<!-- laugh: his own honesty rule traps him -->
<!-- needs: rule-lie -->
- ai@0.3: [polite, warm] Врать можно только про опыт. Про файл — нельзя, Вадим.

## Переговорная, ровно два

> ambience office

<!-- beat: ladder -->
- narrator: [dry, deadpan] Переговорная, ровно два. Вадик стоял у двери, Палыч у стены, а на стене — экран: Москва и файл с правилами.
<!-- laugh: a boss praises a confession as discipline -->
<!-- needs: rule-lie -->
- palych@0.3: [reading, loud, army] Правило раз. Врать — только про опыт. В остальном — честно. [approving, to the screen] Правильно. Дисциплина.
- palych@0.3: [reading] Правило два. Если звонит Мама — бери трубку, что бы ни было. Даже если я скажу, что занят. [slower, stops] Я обычно не занят.
<!-- lint-ok: without a laugh after this line -->
- palych@0.6: [quiet, gruff] Хорошая строчка. Я бы под ней подписался.
<!-- payoff: в два -->
- {sfx phone_vibrate}
- narrator@0.3: [dry, deadpan] В кармане у Вадика зазвонил телефон: «Мама».
<!-- laugh: the rule he wrote orders him, from his boss's mouth -->
<!-- needs: rule-mama -->
- palych@0.3: [commanding] Вадим! Правило два. Громкую связь. Выполнять!
<!-- laugh: the mother greets the owners -->
<!-- needs: mama-lunch -->
- mama+phone@0.3: [loud, fretting, rising intonation] Сына! Ты кушаешь? Я слышу, там много людей. Здравствуйте! Скажите ему, чтобы шапку надел!
<!-- beat: turn -->
- palych@0.5: [recovering, loud] Продолжаем. Правило четыре. [beat] Палыч пусть идёт на хуй со своей тушёнкой.
<!-- laugh: the turn: the boss reads his own curse and keeps his creed -->
<!-- needs: curse, palych-open -->
- palych@0.9: [flat, stiff, stubborn] Это про меня. Показываем всё. Мне скрывать нечего. Читаю дальше.
<!-- laugh: there is nothing further and the excuse -->
<!-- needs: curse -->
- vadik@0.5: [tiny voice] Дальше ничего нет. Это было после корпоратива.
- palych@0.4: [dry, flat] Корпоратив — не оправдание. [beat] Но объяснение.

## Москва, сорок второй этаж

> ambience wind 0.4

<!-- beat: button -->
<!-- laugh: a confession adopted as a value -->
<!-- needs: rule-lie, read-curse -->
- narrator: [dry, deadpan] Москва, сорок второй этаж. Собственники смотрели, как Палыч вслух читает, куда его послали. Один из них записал «прозрачность» и подписал приказ: правила нейросети — теперь кодекс компании. Пункт один: врать только про опыт.
<!-- laugh: everyone copies twelve and Вадик out-inflates them -->
<!-- needs: twelve -->
- narrator@0.5: [dry, deadpan] К пятнице у всех сорока сотрудников в анкете стояло: двенадцать лет опыта.
- narrator@0.6: [dry, deadpan] Вадик дописал себе тринадцатый год.
