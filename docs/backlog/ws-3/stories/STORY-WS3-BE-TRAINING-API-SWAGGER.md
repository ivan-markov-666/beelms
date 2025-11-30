# STORY-WS3-BE-TRAINING-API-SWAGGER – Swagger/OpenAPI документация и UI за Training API

Status: Done

## Summary
Като **QA или developer**, искам **публичен Swagger UI за Training API**, за да мога да виждам документацията на ping/echo ендпойнтите и да изпращам заявки директно от браузъра.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.4 (FR-API-DEMO-1 – публично достъпен Swagger UI).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §4.1 (Swagger UI за Demo API).
- System Architecture – `docs/architecture/system-architecture.md` (описание на Training API и документацията му).
- OpenAPI – `docs/architecture/openapi.yaml` (източник на истината за Training API).
- Traceability – `docs/backlog/WS-PRACTICAL-ENV-traceability.md` (FR-API-DEMO-1).

## Acceptance Criteria
- Има генерирана/поддържана OpenAPI спецификация за Training API, съдържаща най-малко `GET /api/training/ping` и `POST /api/training/echo` с коректни request/response схеми.
- Swagger UI е достъпен на предвидим URL (напр. `/training-api/docs` или `/api/training/docs` – за уточняване в архитектурата).
- Swagger UI позволява изпращане на заявки към реалния Training API (не към mock).
- Описанията на ендпойнтите са човеко-четими (summary/description, примери за payload).
- Swagger UI е конфигуриран така, че да не изисква auth за ping/echo в обхвата на WS-3.

## Dev Tasks
- [x] Конфигуриране на Swagger/OpenAPI поддръжка за Training API:
  - [x] Добавени са зависимостите `@nestjs/swagger` и `swagger-ui-express` (или еквивалент) в `training-api/package.json`.
  - [x] Добавени са основните Swagger декоратори в `TrainingController`/DTO-тата (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`), така че `GET /api/training/ping` и `POST /api/training/echo` да имат ясно описание и схеми.
- [x] Генериране и експониране на Swagger документацията в `training-api` сервиза:
  - [x] В `main.ts` е конфигуриран `SwaggerModule` с подходящ `DocumentBuilder` (title, description, version, tag за Training API).
  - [x] Настроен е предвидим URL за Swagger UI (напр. `/api/training/docs`), описан в story/архитектурата.
  - [x] Swagger UI работи както при локално стартиране (`npm run start:dev`), така и през Docker (`docker compose up training-api`).
- [x] Синхронизация между Swagger документацията и `docs/architecture/openapi.yaml`:
  - [x] Проверено е, че описанията на `GET /api/training/ping` и `POST /api/training/echo` в Swagger (генериран от кода) съвпадат по схеми/статуси с тези в `openapi.yaml`.
  - [x] При нужда са направени минимални корекции в Swagger декораторите или в `openapi.yaml`, така че Training API да има единна, консистентна OpenAPI спецификация.
- [x] Тестове за Swagger UI/документацията:
  - [x] Добавен е e2e smoke тест, който проверява, че Swagger UI route-ът връща HTTP 200 и съдържа заглавие/текст за "Training API".
  - [x] (По избор) e2e/интеграционен тест, който проверява, че в генерираната OpenAPI спецификация присъстват пътищата `/api/training/ping` и `/api/training/echo`.

## Notes
- Тази story зависи от `STORY-WS3-BE-TRAINING-API-MINIMAL` (без реални ендпойнти Swagger UI няма какво да описва).
- В бъдещи WS Swagger/OpenAPI може да бъде разширен с допълнителни ендпойнти (CRUD, tasks), без да се променя базовият подход.
