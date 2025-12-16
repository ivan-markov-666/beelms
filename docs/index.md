# beelms – Обзор на проекта и архитектурата

## 1. Какво е beelms
- Кратко описание на beelms като framework (не само LMS за теб).
- Основни цели и стойност (за кого е, какви проблеми решава).
- Връзка към детайлите в [docs/product/product-brief.md](product/product-brief.md).

## 2. Бизнес контекст и цели
- Обобщение на бизнес целите (от product brief + PRD).
- Основни use cases / сценарии.
- Линкове:
  - PRD: [docs/product/prd.md](product/prd.md)
  - Post-MVP: [docs/product/post-mvp-backlog.md](product/post-mvp-backlog.md)

## 3. Системна архитектура (High-level)
- Кратко текстово обяснение как е устроен beelms:
  - backend API
  - web фронтове
  - admin части, ако има.
- Диаграми/резюме от:
  - [docs/architecture/beelms-core-architecture.md](architecture/beelms-core-architecture.md)
- Връзка към:
  - [docs/architecture/mvp-feature-list.md](architecture/mvp-feature-list.md)
  - [docs/architecture/api-db-docs-index.md](architecture/api-db-docs-index.md)

## 4. Модули и директории в репото
- Кратък „map“ на основните папки:
  - `be/` – backend (NestJS/Express, auth, migrations, тестове…)
  - `fe/` – frontend (Next/React, публично приложение…)
  - `docs/` – документация (product, architecture, delivery…)
- За всеки модул:
  - основна отговорност
  - ключови технологии
  - референция към по-детайлни документи, ако има.

## 5. Данни и домейн модел
- Обобщение на основните домейн обекти (courses, users, sessions, wiki, metrics и т.н.).
- Връзка към:
  - [docs/architecture/db-model.md](architecture/db-model.md)
  - [docs/architecture/admin-metrics-api-examples.md](architecture/admin-metrics-api-examples.md)
  - [docs/architecture/admin-wiki-api-examples.md](architecture/admin-wiki-api-examples.md)
- Ако има специални енумерации/JSON полета – кратко им споменаване.

## 6. Качество, сигурност и DevOps
- Как се подхожда към:
  - сигурност (auth, logging, rate limiting – дори само на високо ниво)
  - тестване (unit/e2e, integration, smoke/regression)
  - observability (metrics, лога – дори и да е планово)
- Връзка към:
  - релевантни delivery/checklist документи (ако вече ги добавиш за beelms).

## 7. Процес и работни потоци (BMAD/BMM)
- Кратко обяснение:
  - че проектът използва BMAD + BMM Enterprise brownfield път
  - че има workflow tracking файл:
    - [docs/bmm-workflow-status.yaml](bmm-workflow-status.yaml)
- Как се ползват:
  - `*workflow-status`
  - `*document-project`, `*prd`, `*create-architecture` и т.н. (само като списък).


## 8. Следващи стъпки и как да се ориентира нов човек
- Какво да прочете първо (product-brief → system-architecture → PRD).
- Как да стартира локално (кратък overview, с линк към по-подробен setup, ако има).
- Къде да гледа текущ прогрес:
  - [docs/bmm-workflow-status.yaml](bmm-workflow-status.yaml)

