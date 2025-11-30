# STORY-WS3-BE-TRAINING-API-MINIMAL – Минимален Training API с ping/echo ендпойнти

Status: Done

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
- [x] Дизайн на структурата на Training API като самостоятелен NestJS сервиз `training-api` в отделен контейнер зад API Gateway, в синхрон със `system-architecture.md`:
  - [x] Създадена е нова папка `training-api` с базова NestJS структура (`src/main.ts`, `src/app.module.ts`).
  - [x] Добавен е модул `TrainingModule` (`src/training/training.module.ts`), който капсулира контролера и услугата.
  - [x] Добавени са основните конфигурационни файлове (`package.json`, `tsconfig*.json`, `jest.config.*`, `Dockerfile`) за самостоятелно билдване и стартиране на сервиза.
- [x] Имплементация на контролер/route-ове за `GET /api/training/ping` и `POST /api/training/echo` в `TrainingController`:
  - [x] `GET /api/training/ping` връща винаги HTTP 200 и body с `message: "pong"` (по избор и `timestamp`).
  - [x] `POST /api/training/echo` вика съответния service метод и връща описаната структура `{ value, receivedAt, requestId }`.
  - [x] И двата ендпойнта са публични (неизискват JWT) в обхвата на WS-3.
- [x] Добавяне на основни DTO/валидация за `echo` ендпойнта:
  - [x] DTO клас за входящото body с изискване за наличие на поле `value`.
  - [x] Включена е NestJS validation pipe конфигурация, така че при липсващо/невалидно `value` да се връща HTTP 400 с ясно съобщение.
- [x] Unit тестове за ping/echo логиката в `TrainingService`:
  - [x] Позитивен сценарий за echo (връща подаденото `value`, валиден `receivedAt` и непразен `requestId`).
  - [x] (По избор) прост тест за ping логиката.
- [x] E2E тестове (supertest) за основните сценарии (200 ping, 200 echo, 400 при невалиден input):
  - [x] `GET /api/training/ping` → 200 + `message: "pong"`.
  - [x] `POST /api/training/echo` с валидно body → 200 + коректна структура на отговора.
  - [x] `POST /api/training/echo` с невалидно/празно body → 400 + съобщение за грешка.
- [x] Актуализиране на `openapi.yaml` с описанията на двата ендпойнта:
  - [x] Описан е `GET /api/training/ping` с примерен отговор.
  - [x] Описан е `POST /api/training/echo` с пример за входно body и за отговор (включително полетата `value`, `receivedAt`, `requestId`).
- [x] Добавяне на `training-api` сервиза в `docker-compose.yml` за локална разработка (порт, env, build context) и проверка, че endpoint-ите работят през контейнера.

## Notes
- Тази story е предпоставка за `STORY-WS3-BE-TRAINING-API-SWAGGER` и `STORY-WS3-FE-TRAINING-API-INTRO`.
- В бъдещи WS/epics Training API може да бъде разширен с CRUD ресурс и по-сложни сценарии (описани в PRD/MVP като post-MVP).
