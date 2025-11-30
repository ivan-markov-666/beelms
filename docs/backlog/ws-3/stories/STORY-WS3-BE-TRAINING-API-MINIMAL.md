# STORY-WS3-BE-TRAINING-API-MINIMAL – Минимален Training API с ping/echo ендпойнти

## Summary
Като **QA, упражняващ API/integration тестване**, искам **минимален Training API с ping/echo ендпойнти**, за да мога да правя позитивни и негативни тестове върху стабилен, но опростен REST API.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.4 (FR-API-DEMO-2 – поне два ендпойнта за упражнения).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §4.1–4.2 (Demo API / Training API – ping/echo).
- System Architecture – `docs/architecture/system-architecture.md` (компонент „Training API“).
- OpenAPI – `docs/architecture/openapi.yaml` (описание на Training API, когато бъде добавен).
- Traceability – `docs/backlog/WS-PRACTICAL-ENV-traceability.md` (FR-API-DEMO-1..2).

## Acceptance Criteria
- Имплементиран е Training API модул/услуга (NestJS или еквивалент), експониран на префикс `/api/training`.
- Endpoint `GET /api/training/ping`:
  - връща HTTP 200;
  - body: `{ "message": "pong" }` (може да включва и `timestamp` по избор).
- Endpoint `POST /api/training/echo`:
  - приема JSON body, съдържащо свойство `value` (произволен тип);
  - при валидно body връща HTTP 200 и JSON от вида `{ "value": <подадената стойност>, "receivedAt": <ISO timestamp>, "requestId": <string> }`;
  - при липсващо/невалидно body (напр. липсва `value`) връща HTTP 400 с ясно съобщение за грешка.
- И двата ендпойнта са публични (неизискват JWT) в обхвата на WS-3.
- Логиката не записва нищо трайно в база (stateless demo API за упражнения).

## Dev Tasks
- [ ] Дизайн на структурата на Training API като самостоятелен NestJS сервиз `training-api` в отделен контейнер зад API Gateway, в синхрон със `system-architecture.md`.
- [ ] Имплементация на контролер/route-ове за `GET /api/training/ping` и `POST /api/training/echo`.
- [ ] Добавяне на основни DTO/валидация за `echo` ендпойнта.
- [ ] Unit тестове за ping/echo логиката.
- [ ] E2E тестове (supertest) за основните сценарии (200 ping, 200 echo, 400 при невалиден input).
- [ ] Актуализиране на `openapi.yaml` с описанията на двата ендпойнта.

## Notes
- Тази story е предпоставка за `STORY-WS3-BE-TRAINING-API-SWAGGER` и `STORY-WS3-FE-TRAINING-API-INTRO`.
- В бъдещи WS/epics Training API може да бъде разширен с CRUD ресурс и по-сложни сценарии (описани в PRD/MVP като post-MVP).
