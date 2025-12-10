# beelms – Обзор на проекта и архитектурата

## 1. Какво е beelms
- Кратко описание на beelms като framework (не само LMS за теб).
- Основни цели и стойност (за кого е, какви проблеми решава).
- Връзка към детайлите в [docs/product/product-brief.md](cci:7://file:///d:/Projects/qa-4-free/docs/product/product-brief.md:0:0-0:0).

## 2. Бизнес контекст и цели
- Обобщение на бизнес целите (от product brief + PRD).
- Основни use cases / сценарии.
- Линкове:
  - PRD: [docs/product/prd.md](cci:7://file:///d:/Projects/qa-4-free/docs/product/prd.md:0:0-0:0)
  - Post-MVP: [docs/product/post-mvp-backlog.md](cci:7://file:///d:/Projects/qa-4-free/docs/product/post-mvp-backlog.md:0:0-0:0)

## 3. Системна архитектура (High-level)
- Кратко текстово обяснение как е устроен beelms:
  - backend API
  - web фронтове
  - training / admin части, ако има.
- Диаграми/резюме от:
  - [docs/architecture/system-architecture.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/system-architecture.md:0:0-0:0)
  - [docs/architecture/core-framework-extraction-plan.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/core-framework-extraction-plan.md:0:0-0:0)
- Връзка към:
  - [docs/architecture/mvp-feature-list.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/mvp-feature-list.md:0:0-0:0)
  - [docs/architecture/api-db-docs-index.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/api-db-docs-index.md:0:0-0:0)

## 4. Модули и директории в репото
- Кратък „map“ на основните папки:
  - `be/` – backend (NestJS/Express, auth, migrations, тестове…)
  - `fe/` – frontend (Next/React, публично приложение…)
  - `training-api/` – training специфична услуга
  - `docs/` – документация (product, architecture, delivery, backlog…)
- За всеки модул:
  - основна отговорност
  - ключови технологии
  - референция към по-детайлни документи, ако има.

## 5. Данни и домейн модел
- Обобщение на основните домейн обекти (courses, users, sessions, wiki, metrics и т.н.).
- Връзка към:
  - [docs/architecture/db-model.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/db-model.md:0:0-0:0)
  - [docs/architecture/training-api-examples.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/training-api-examples.md:0:0-0:0)
  - [docs/architecture/admin-metrics-api-examples.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/admin-metrics-api-examples.md:0:0-0:0)
  - [docs/architecture/admin-wiki-api-examples.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/admin-wiki-api-examples.md:0:0-0:0)
- Ако има специални енумерации/JSON полета – кратко им споменаване.

## 6. Качество, сигурност и DevOps
- Как се подхожда към:
  - сигурност (auth, logging, rate limiting – дори само на високо ниво)
  - тестване (unit/e2e, integration, smoke/regression)
  - observability (metrics, лога – дори и да е планово)
- Връзка към:
  - [docs/architecture/devops-nginx-media.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/devops-nginx-media.md:0:0-0:0)
  - релевантни delivery/checklist документи (ако вече ги добавиш за beelms).

## 7. Процес и работни потоци (BMAD/BMM)
- Кратко обяснение:
  - че проектът използва BMAD + BMM Enterprise brownfield път
  - че има workflow tracking файл:
    - [docs/bmm-workflow-status.yaml](cci:7://file:///d:/Projects/qa-4-free/docs/bmm-workflow-status.yaml:0:0-0:0)
- Как се ползват:
  - `*workflow-status`
  - `*document-project`, `*prd`, `*create-architecture` и т.н. (само като списък).
- По желание: линк към [docs/architecture/development-workflow.md](cci:7://file:///d:/Projects/qa-4-free/docs/architecture/development-workflow.md:0:0-0:0), ако го адаптираш за beelms.

## 8. Следващи стъпки и как да се ориентира нов човек
- Какво да прочете първо (product-brief → system-architecture → PRD).
- Как да стартира локално (кратък overview, с линк към по-подробен setup, ако има).
- Къде да гледа текущ прогрес:
  - [docs/bmm-workflow-status.yaml](cci:7://file:///d:/Projects/qa-4-free/docs/bmm-workflow-status.yaml:0:0-0:0)
  - `docs/sprint-artifacts/` (когато започнеш да го ползваш активно).
