# STORY-WS3-BE-TRAINING-API-SWAGGER – Swagger/OpenAPI документация и UI за Training API

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
- [ ] Конфигуриране на NestJS Swagger (или еквивалентен инструмент) за Training API.
- [ ] Свързване на Swagger генерацията с `openapi.yaml` (ако се поддържа отделен файл) или генериране на документацията от кода.
- [ ] Настройка на route за Swagger UI и осигуряване, че е достъпен в dev среда.
- [ ] Smoke тест (e2e) за достъп до Swagger UI и базова проверка на съдържанието.

## Notes
- Тази story зависи от `STORY-WS3-BE-TRAINING-API-MINIMAL` (без реални ендпойнти Swagger UI няма какво да описва).
- В бъдещи WS Swagger/OpenAPI може да бъде разширен с допълнителни ендпойнти (CRUD, tasks), без да се променя базовият подход.
