# WS-1 Wiki – Backend Tasks

Свързан epic: `EPIC-WS1-WIKI-BE.md`  
Свързани stories:
- `STORY-WS1-BE-WIKI-DB-SEED`
- `STORY-WS1-BE-WIKI-LIST-ENDPOINT`
- `STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT`

Референция: `docs/sprint-artifacts/WS1-wiki-demo-checklist.md`

---

## WS1-BE-01 – DB модели и миграции за WikiArticle/WikiArticleVersion
- Story: `STORY-WS1-BE-WIKI-DB-SEED`
- Цел: да има коректни таблици и релации за WikiArticle/WikiArticleVersion според DB модела.

**Checklist:**
- [ ] Дефинирани са ORM entity-та `WikiArticle` и `WikiArticleVersion` според `docs/architecture/db-model.md`.
- [ ] Създадени са миграции за таблиците (вкл. индекси по `slug`, `status`, език и др. ключови полета).
- [ ] Миграциите се изпълняват успешно срещу локалната PostgreSQL инстанция.

---

## WS1-BE-02 – Seed данни за Wiki статии
- Story: `STORY-WS1-BE-WIKI-DB-SEED`
- Цел: да има минимум примерни статии, с които FE да работи по WS-1.

**Checklist:**
- [ ] Имплементиран е seed механизъм (скрипт или миграция), който създава примерни Wiki статии.
- [ ] Има поне една BG статия и по възможност EN версия на една статия.
- [ ] Всички seed-нати статии са със статус `active`.
- [ ] Seed-ът е документиран накратко (как се стартира) в README/Dev notes.

---

## WS1-BE-03 – Endpoint: `GET /api/wiki/articles` (списък)
- Story: `STORY-WS1-BE-WIKI-LIST-ENDPOINT`
- Цел: гост потребителят да може да получи списък със статии.

**Checklist:**
- [ ] Създаден е `WikiModule` (ако още не съществува) с `WikiService` и `WikiController`.
- [ ] Имплементиран е ендпойнт `GET /api/wiki/articles`, който:
  - [ ] чете само статии със статус `active`;
  - [ ] връща полетата, описани в story-то (заглавие, език, slug, последна редакция и т.н.).
- [ ] Добавени са unit тестове за `WikiService` (поне happy path + празен списък).
- [ ] (по избор) Добавен е basic integration тест за ендпойнта.

---

## WS1-BE-04 – Endpoint: `GET /api/wiki/articles/{slug}` (детайл)
- Story: `STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT`
- Цел: гост потребителят да може да отвори конкретна статия по slug.

**Checklist:**
- [ ] Имплементиран е ендпойнт `GET /api/wiki/articles/{slug}` в `WikiController`.
- [ ] При активна статия се връща `200 OK` с детайлите, описани в story-то.
- [ ] При липсваща/неактивна статия се връща `404` в съответствие със story-то и PRD.
- [ ] При вътрешна грешка се връщат коректни 5xx кодове, без да се изтича излишна информация.
- [ ] Добавени са unit тестове за success / not-found / error сценарии.

---

## WS1-BE-05 – Backend тестове и покриване на WS1 чеклиста
- Stories: всички WS-1 BE stories.
- Цел: да се потвърди, че BE частта покрива описаните acceptance criteria и WS1 чеклиста.

**Checklist:**
- [ ] Прегледани са acceptance criteria на трите BE stories и те са покрити от имплементацията.
- [ ] Основните BE сценарии от `WS1-wiki-demo-checklist.md` са минати успешно (List + Article).
- [ ] Няма известни P0/P1 дефекти, свързани с Wiki BE WS-1.
