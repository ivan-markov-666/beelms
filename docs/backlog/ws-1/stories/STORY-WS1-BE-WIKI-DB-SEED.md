# STORY-WS1-BE-WIKI-DB-SEED – Миграции и начални данни за WikiArticle/WikiArticleVersion

Status: Approved

## Summary
Като **delivery екип** искаме реалната PostgreSQL база да има нужните таблици и няколко примерни Wiki статии, за да може walking skeleton WS-1 да работи с истински данни, без ръчен insert всеки път.

## Links to BMAD artifacts
- DB модел – `docs/architecture/db-model.md` (структура на `WikiArticle` и `WikiArticleVersion`).
- System Architecture – `docs/architecture/system-architecture.md` (раздел за база данни).
- Walking skeleton – `docs/delivery/walking-skeleton.md` §2.3.3 (миграции и seed за Wiki).

## Acceptance Criteria
- Съществуват миграции (напр. TypeORM migrations), които създават таблиците за `WikiArticle` и `WikiArticleVersion` според DB модела.
- Миграциите могат да се пуснат успешно в локална dev среда през стандартна команда (npm/yarn).
- Налични са поне 2–3 примерни статии в seed данните:
  - поне една статия на BG;
  - по възможност и EN версия на една статия;
  - статусът на тези статии е `active`.

## Dev Tasks
- [ ] Дефиниране на TypeORM entity класове за `WikiArticle` и `WikiArticleVersion` според `docs/architecture/db-model.md`.
- [ ] Създаване на миграции за съответните таблици, индекси и релации.
- [ ] Имплементиране на seed механизъм (напр. отделен скрипт или миграция), който вмъква примерните статии.
- [ ] Тестване на миграциите и seed-a в чиста локална база (up/down сценарии).
- [ ] Ръчно потвърждение (чрез SQL/ORM или API), че статии се зареждат коректно и са достъпни през API ендпойнтите.

## Notes
- Преди изпълнение на това story се изгражда базова Docker инфраструктура: BE проектът в `be/` работи в собствен контейнер, свързан към PostgreSQL контейнер (чрез `docker-compose`), така че миграциите и seed-ът да се изпълняват в контейнеризирана среда.
- Seed механизмът е предназначен основно за dev/test среди; в production трябва да се използва внимателно и съобразено с реалните данни и процеси по одобрение на съдържание.
- Добра практика е seed-натите статии да използват стабилни `slug` стойности, които се ползват и в FE тестовете (`STORY-WS1-FE-WIKI-LIST`, `STORY-WS1-FE-WIKI-ARTICLE`).
- Препоръчително е да се координират примерните данни с PRD/UX, за да отразяват реални, типични сценарии за Wiki.
