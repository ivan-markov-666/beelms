# STORY-WS1-BE-WIKI-LIST-ENDPOINT – `GET /api/wiki/articles` връща списък от активни статии

## Summary
Като **frontend приложение** искам да имам ендпойнт `GET /api/wiki/articles`, който връща списък от активни Wiki статии, за да покажа публичен списък на `/wiki`.

## Links to BMAD artifacts
- OpenAPI – `docs/architecture/openapi.yaml` (`GET /api/wiki/articles`).
- DB модел – `docs/architecture/db-model.md` (ентитети `WikiArticle`, `WikiArticleVersion`).
- System Architecture – `docs/architecture/system-architecture.md` (Wiki услуга).
- Walking skeleton – `docs/delivery/walking-skeleton.md` §2.3.2–2.3.3.
- WS-1 Demo & Test Checklist – `docs/sprint-artifacts/WS1-wiki-demo-checklist.md`.

## Acceptance Criteria
- Съществува NestJS контролер/route за `GET /api/wiki/articles`.
- При успешен отговор API връща `200 OK` и JSON масив от статии.
- Връщат се **само** статии със статус `active`.
- Всеки елемент в масива съдържа поне: `id`, `slug`, език, заглавие, кратка информация (напр. кратък excerpt или дата на последна редакция).
- Резултатите са подредени по избран критерий (напр. последна редакция низходящо).
- При липса на активни статии ендпойнтът връща `200 OK` с празен масив.
- При вътрешна грешка ендпойнтът връща подходящ `5xx` статус код, така че frontend-ът да може да покаже общо **Error** състояние според `STORY-WS1-FE-WIKI-STATES`.

## Dev Tasks
- [ ] Създаване на `WikiModule` (ако все още не съществува) и добавяне на контролер/route за `GET /api/wiki/articles`.
- [ ] Имплементиране на `WikiService` метод, който чете от базата данни/репозиторито и филтрира по `status = active`.
- [ ] Мапване на резултатите към DTO/response модел, подходящ за frontend.
- [ ] Добавяне на базови unit тестове за `WikiService` метода.
- [ ] (по избор) Интеграционен тест за `GET /api/wiki/articles` срещу test база.
- [ ] Ръчно тестване чрез Swagger UI/Postman и през frontend-а на `/wiki`.

## Notes
- Зависимост от епика `EPIC-WS1-WIKI-BE` за налични и стабилни ендпойнти, както и от `STORY-WS1-BE-WIKI-DB-SEED` за реални данни в базата.
- Поведенческият contract (полета, сортиране, филтриране по `status = active`) трябва да остане в синхрон със `STORY-WS1-FE-WIKI-LIST` и релевантните PRD/UX секции.
- Препоръчително е тестовете да покриват сценарии: без статии, една статия и множество статии, за да се валидират всички гранични случаи.
