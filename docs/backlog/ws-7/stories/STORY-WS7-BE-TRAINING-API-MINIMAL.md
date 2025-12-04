# STORY-WS7-BE-TRAINING-API-MINIMAL – Минимален Training API (ping/echo)

Status: Done

## Summary
Като **потребител/курсист** искам да има **публичен Training API с прости ping/echo endpoints**, за да мога да упражнявам изпращане на HTTP заявки (manual или automated), без да засягам основните бизнес данни.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.4 (FR-API-DEMO-1..3 – Training API & Swagger UI).  
- MVP feature list – `docs/architecture/mvp-feature-list.md` §4.1–4.2 (минимален Training API).  
- System Architecture – `docs/architecture/system-architecture.md` (компонент „Training API“).  
- OpenAPI – `docs/architecture/openapi.yaml` (Training API секция – да се синхронизира при нужда).  
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-PRACTICE-API-DEMO).

## Acceptance Criteria
- Съществува публичен Training API с поне следните endpoints:
  - `GET /api/training/ping`:
    - връща `200 OK` с JSON payload (напр. `{ "status": "ok" }` или `{ "pong": true }`);
    - не изисква аутентикация;
    - подходящ е за бърз health/API тест.
  - `POST /api/training/echo`:
    - приема JSON body (произволна структура или ограничен schema);
    - връща `200 OK` и в тялото си включва отразено (echo) входното съдържание (или част от него), така че да е полезно за API упражнения;
    - при невалидно JSON тяло връща `400 Bad Request` с ясно съобщение.
- Endpoint-ите са:
  - независими от основните Auth/Wiki/Admin данни (не променят реална бизнес информация);
  - достатъчно „стабилни“, за да се използват за практическите задачи и автоматизирани тестове.
- Training API е описан в `openapi.yaml` с коректни request/response схеми.

## Dev Tasks
- [x] Дизайн на минимален Training API модул в NestJS (controller/service) под `/api/training`.
- [x] Имплементация на `GET /api/training/ping` с прост JSON отговор (health/demo).
- [x] Имплементация на `POST /api/training/echo`:
  - [x] приемане на JSON body;
  - [x] връщане на echo отговор (понe частично отражение на входа) + базови validation правила;
  - [x] обработка на невалидно JSON тяло (400).
- [x] Добавяне/актуализиране на Training API секцията в `docs/architecture/openapi.yaml`.
- [x] Unit тестове за Training API service/controller (ping + echo + error case).
- [x] E2E тест(ове) за Training API endpoints (успешни/грешни заявки).

## Notes
- За WS-7 целта е **минимален**, но стабилен API – по-сложни сценарии (авторизация, rate limiting, quotas) могат да се добавят в бъдещи WS/epics (EPIC-CROSS-SECURITY).
- Training API може да се използва и за демонстрации в документацията (примерни curl/Postman заявки, Swagger UI).
