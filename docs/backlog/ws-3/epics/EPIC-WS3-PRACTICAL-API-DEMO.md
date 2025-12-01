# EPIC-WS3-PRACTICAL-API-DEMO – Training API (минимален Demo API + Swagger)

Status: Done

## Summary
Този epic обхваща backend/API частта на WS-3 walking skeleton за **Practical Environment – API Demo / Training API**: минимален NestJS Training API с ping/echo ендпойнти и публичен Swagger UI за упражнения по API/integration тестване.

## Scope (какво покрива този epic)
- Минимален Training API модул/услуга, достъпна през HTTP, напр. под префикс `/api/training`.
- Ендпойнти (FR-API-DEMO-2):
  - `GET /api/training/ping` → `{ message: "pong" }`.
  - `POST /api/training/echo` → приема JSON payload и го връща обратно с метаданни (напр. `receivedAt`, `requestId`).
 - Сценарии за позитивни и негативни тестове (валидни и невалидни payload-и, различни статус кодове), в синхрон с PRD §4.4 (FR-API-DEMO-2).
 - Публично достъпен **Swagger/OpenAPI** интерфейс (FR-API-DEMO-1):
  - документация за ping/echo ендпойнтите;
  - възможност за изпращане на заявки директно през Swagger UI.
 - Интеграция с общата архитектура:
  - Training API се реализира като самостоятелен NestJS сервиз в отделен Docker контейнер (FR-API-DEMO-3);
  - експониране зад съществуващия API gateway/Reverse proxy.

Out of scope за този epic (за post-MVP / бъдещи WS):
- Пълен CRUD demo ресурс (create/read/update/delete върху примерен домейн обект).
- Задачи/оценяване върху Training API (FR-TASKS-1..3).

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (§5.1 – практическа API среда).
- PRD – `docs/product/prd.md` (§4.4 FR-API-DEMO-1..3).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§4 Практическа среда – API демо).
- System Architecture – `docs/architecture/system-architecture.md` (компонент „Training API“ и свързания API gateway).
- UX Design – `docs/ux/qa4free-ux-design.md` (екран „API Demo / Training API“).
- OpenAPI – `docs/architecture/openapi.yaml` (описание на Training API ендпойнтите, когато бъдат добавени).
- Traceability – `docs/backlog/WS-PRACTICAL-ENV-traceability.md` (FR-API-DEMO).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-PRACTICE-API-DEMO, EPIC-PRACTICE-TASKS).

## Child user stories
- [x] STORY-WS3-BE-TRAINING-API-MINIMAL – Минимален Training API с ping/echo ендпойнти.
- [x] STORY-WS3-BE-TRAINING-API-SWAGGER – Swagger/OpenAPI документация и UI за Training API.
- [x] STORY-WS3-FE-TRAINING-API-INTRO – FE екран „API Demo / Training API“ с линк към Swagger и примерни упражнения.

## Risks / Assumptions
- **Risks:**
  - Ако инфраструктурната част (reverse proxy, routing) закъснее, публичният достъп до Training API и Swagger UI може да е затруднен.
  - Неправилно конфигуриран CORS/безопасност може да затрудни упражненията през браузър и инструменти.
- **Assumptions:**
  - Съществува базова Docker/Compose инфраструктура, която позволява добавяне на нов контейнер/услуга за Training API.
  - Минималният Training API няма да изисква автентикация в WS-3 (public demo), освен ако не бъде изрично решено друго по сигурност.

## Definition of Done (Epic)
- Съществува работещ Training API с `GET /api/training/ping` и `POST /api/training/echo`.
- Training API е документиран и достъпен през Swagger UI.
- Основните сценарии за ping/echo са покрити с unit и e2e тестове.
- Training API е интегриран в Docker/Compose (или еквивалентна dev среда) и може да бъде стартиран заедно с останалите услуги.
- FE екранът „API Demo / Training API" (от STORY-WS3-FE-TRAINING-API-INTRO) се позовава на реално работещ Swagger UI.
- Няма отворени P0/P1 дефекти, свързани с Training API или Swagger UI в обхвата на WS-3.
