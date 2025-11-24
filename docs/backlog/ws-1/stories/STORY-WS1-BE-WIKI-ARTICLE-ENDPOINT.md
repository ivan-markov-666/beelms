# STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT – `GET /api/wiki/articles/{slug}` връща детайл за статия

## Summary
Като **frontend приложение** искам да имам ендпойнт `GET /api/wiki/articles/{slug}`, който връща детайл за конкретна активна Wiki статия по `slug`, за да покажа съдържанието й на `/wiki/[slug]`.

## Links to BMAD artifacts
- OpenAPI – `docs/architecture/openapi.yaml` (`GET /api/wiki/articles/{slug}`).
- DB модел – `docs/architecture/db-model.md` (връзка между `WikiArticle` и `WikiArticleVersion`).
- System Architecture – `docs/architecture/system-architecture.md` (Wiki услуга).
- Walking skeleton – `docs/delivery/walking-skeleton.md` §2.3.2–2.3.3.

## Acceptance Criteria
- Съществува NestJS контролер/route за `GET /api/wiki/articles/{slug}`.
- Ако съществува активна статия с подадения `slug`:
  - API връща `200 OK` и JSON обект с детайлите за статията: заглавие, език, съдържание (body), информация за версия/последна редакция и др. според OpenAPI.
- Ако **не** съществува такава статия или е неактивна:
  - API връща `404 Not Found`.
- При вътрешна грешка API връща `5xx` код и общо съобщение за грешка.

## Dev Tasks
- [ ] Добавяне на route/handler за `GET /api/wiki/articles/{slug}` в `WikiController`.
- [ ] Имплементиране на `WikiService` метод, който намира статия по `slug` и статус, и връща нужните детайли.
- [ ] Обработка на случаи без резултат (връщане на 404).
- [ ] Добавяне на базови unit тестове за `WikiService` и/или контролера за този сценарий.
- [ ] (по избор) Интеграционен тест за `GET /api/wiki/articles/{slug}` срещу test база.
- [ ] Ръчно тестване чрез Swagger UI/Postman и през frontend-а на `/wiki/[slug]`.

## Notes
- Зависимост от `STORY-WS1-BE-WIKI-DB-SEED` за налични примерни статии и от `STORY-WS1-FE-WIKI-ARTICLE` за реална употреба на ендпойнта от frontend.
- Важно е разликата между 404 (липсваща/неактивна статия) и 5xx (вътрешна грешка) да бъде ясно отразена, тъй като `STORY-WS1-FE-WIKI-STATES` разчита на тези кодове за правилни UX състояния.
- Тестовете трябва да покриват поне: валиден `slug`, невалиден/деактивиран `slug`, както и симулирана вътрешна грешка.
