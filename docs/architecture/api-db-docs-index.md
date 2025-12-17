# beelms – API & DB документация (index)

Този документ е входна точка за техническата документация на BE/API и модела на базата данни.

## 1. OpenAPI спецификация

- `docs/architecture/openapi.yaml` – основният източник на истина за:
  - Auth, Account (`/auth/...`, `/users/me`);
  - Courses & Assessments (`/courses...`, `/users/me/courses`, quizzes endpoints);
  - Wiki (public и Admin Wiki);
  - Admin Metrics (`/admin/metrics/overview`).

Препоръка: при промяна по API първо се обновява **OpenAPI**, после BE/FE и примерните документи.

## 2. Модел на базата данни

- `docs/architecture/db-model.md` – концептуален ER модел (Mermaid) и описания на основните ентитети.

## 3. Admin Wiki

- **API спецификация:**
  - OpenAPI – секция **Admin Wiki (CRUD + версии)** в `openapi.yaml`.
- **Примерни заявки:**
  - `docs/architecture/admin-wiki-api-examples.md`.
- **Свързани BE файлове:**
  - `be/src/wiki/wiki.service.ts`;
  - `be/src/wiki/admin-wiki.controller.ts`.
  - `be/src/wiki/dto/*.ts` – DTO-та за list/detail/create/update/versions.

## 4. Admin Metrics

- **API спецификация:**
  - OpenAPI – секция **Admin / Metrics (MVP ниво)** в `openapi.yaml` (`/admin/metrics/overview`).
- **Примерни заявки:**
  - `docs/architecture/admin-metrics-api-examples.md` – `curl` пример + обяснение на полето `usersChangePercentSinceLastMonth`.
- **Свързани BE файлове:**
  - `be/src/auth/admin-metrics.service.ts` – изчисление на метриките;
  - `be/src/auth/admin-metrics.controller.ts` – endpoint `GET /admin/metrics/overview`.

## 5. Auth & Account

- **API спецификация:**
  - OpenAPI – секция **Auth Service** + `/users/me` в `openapi.yaml`.
- **Примерни заявки:**
  - `docs/architecture/auth-api-examples.md` –
    - `POST /auth/register`,
    - `POST /auth/login`,
    - `GET /users/me`,
    - `POST /auth/forgot-password`,
    - `POST /auth/reset-password`,
    - `POST /auth/verify-email`.
- **Свързани BE файлове:**
  - `be/src/auth/*.ts` – NestJS Auth module, guards, DTO-та.

## 6. Насоки за поддръжка

Когато добавяте нови API-та или разширявате съществуващи:

1. Обновете `openapi.yaml` (schemas + paths).
2. Обновете съответните BE/FE имплементации.
3. Ако endpoint-ът е важен за упражнения или за Admin UI, добавете или актуализирайте примерните документи в `admin-wiki-api-examples.md`, `admin-metrics-api-examples.md` и `auth-api-examples.md`.
4. При промяна по модела на данните – синхронизирайте `db-model.md` (ER диаграмата и описанията).
