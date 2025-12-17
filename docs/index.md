 # beelms – Индекс на документацията (BMAD)

Този файл е **входната точка** за документацията на **beelms core** (рамка), организирана по BMAD/BMM.
Целта е да има ясна вертикална следа:

Product Brief → PRD → UX → Architecture → Epics/Stories → Test Design → Delivery (Walking Skeletons/Plans)

## 1. Какво е beelms core

beelms core е opinionated рамка за изграждане на хибридни LMS системи с wiki характер (wiki + курсове + базови quizzes), проектирана за **Lean Tier 0** деплой (single VPS + Docker Compose), с възможност за постепенно надграждане.

- **Product Brief (визия, аудитория, MVP обхват):** [docs/product/product-brief.md](product/product-brief.md)

## 2. Канонични BMAD артефакти (вертикално подредени)

### 2.0. Discovery

- **Brainstorm (решения и допускания):** [docs/backlog/brainstorm-beelms-core.md](backlog/brainstorm-beelms-core.md)
- **Technical Research:** [docs/analysis/research/technical-self-hosted-lms-architecture-research-2025-12-10.md](analysis/research/technical-self-hosted-lms-architecture-research-2025-12-10.md)

### 2.1. Product / Planning

- **Product Brief:** [docs/product/product-brief.md](product/product-brief.md)
- **PRD (FR области + NFR резюме + трейса):** [docs/product/prd.md](product/prd.md)
- **Post-MVP backlog (future идеи):** [docs/product/post-mvp-backlog.md](product/post-mvp-backlog.md)

### 2.2. UX

- **UX Design Specification (IA, потоци, wireframe ниво):** [docs/ux-design-specification.md](ux-design-specification.md)
- **UX Design System (MVP):** [docs/ux/design-system.md](ux/design-system.md)

### 2.3. Architecture

- **System Architecture:** [docs/architecture/beelms-core-architecture.md](architecture/beelms-core-architecture.md)
- **MVP Feature List (поведение по екрани):** [docs/architecture/mvp-feature-list.md](architecture/mvp-feature-list.md)
- **API & DB docs index:** [docs/architecture/api-db-docs-index.md](architecture/api-db-docs-index.md)
- **OpenAPI (API договор):** [docs/architecture/openapi.yaml](architecture/openapi.yaml)
- **DB Model (ER модел):** [docs/architecture/db-model.md](architecture/db-model.md)

### 2.4. Backlog

- **EPIC & Story Map (каноничен breakdown за MVP):** [docs/backlog/beelms-core-epics-and-stories.md](backlog/beelms-core-epics-and-stories.md)

### 2.5. Testing

- **Test Design / Strategy (нива, рискове, EPIC покритие):** [docs/testing/beelms-core-test-design.md](testing/beelms-core-test-design.md)

### 2.6. Delivery

- **Implementation Readiness:** [docs/delivery/beelms-core-implementation-readiness.md](delivery/beelms-core-implementation-readiness.md)
- **Walking Skeletons (вертикални slice-ове):** [docs/delivery/walking-skeleton.md](delivery/walking-skeleton.md)
- **Test Plan (Delivery):** [docs/delivery/test-plan.md](delivery/test-plan.md)
- **Release Plan (Delivery):** [docs/delivery/release-plan.md](delivery/release-plan.md)
- **Sprint Planning (BMAD Implementation):** [docs/sprint-artifacts/beelms-core-sprint-planning.md](sprint-artifacts/beelms-core-sprint-planning.md)

### 2.7. Quality gates

- **MVP DoD checklist:** [docs/architecture/mvp-bmad-dod-checklist.md](architecture/mvp-bmad-dod-checklist.md)

### 2.8. Ops / DevEx

- **Локален CI (без cloud):** [docs/ops/local-ci.md](ops/local-ci.md)
- **Nginx wiki media (MVP):** [docs/ops/devops-nginx-media.md](ops/devops-nginx-media.md)

## 3. Препоръчан ред за четене (за нов човек)

1. [Product Brief](product/product-brief.md)
2. [PRD](product/prd.md)
3. [UX Design Specification](ux-design-specification.md)
4. [System Architecture](architecture/beelms-core-architecture.md)
5. [MVP Feature List](architecture/mvp-feature-list.md)
6. [EPIC & Story Map](backlog/beelms-core-epics-and-stories.md)
7. [Test Design](testing/beelms-core-test-design.md)
8. [Implementation Readiness](delivery/beelms-core-implementation-readiness.md)
9. [Walking Skeletons](delivery/walking-skeleton.md)
10. [Sprint Planning](sprint-artifacts/beelms-core-sprint-planning.md)

## 4. “Source of truth” правила

- **Scope и намерение (какво строим):** Product Brief + PRD.
- **Поведение по екрани и UX сценарии:** MVP Feature List + UX Design Specification.
- **Техническа реализация и tradeoffs:** System Architecture.
- **API договор (ендпойнти + схеми):** OpenAPI (`docs/architecture/openapi.yaml`).
- **Данни/модел:** DB Model (`docs/architecture/db-model.md`).

Препоръка при промяна по функционалност:

1. Обнови PRD/MVP Feature List (ако променяш обхват/поведение).
2. Обнови OpenAPI/DB Model (ако променяш договор или данни).
3. После синхронизирай BE/FE и примерните API документи.

## 5. Процес и BMAD/BMM tracking

- **Workflow status (канонични пътища към артефактите):** [docs/bmm-workflow-status.yaml](bmm-workflow-status.yaml)

## 6. Структура на репото (високо ниво)

- `docs/` – BMAD документация (product, ux, architecture, delivery, testing, ops)
- `be/` – backend, миграции/seed, тестове
- `fe/` – frontend (референтен Next.js UI)
- `tools/` – помощни инструменти (валидатор за линкове в docs)

## 7. Проверка на документацията (quality gate)

За структурна проверка на локални препратки в `docs/`:

- `powershell -NoProfile -ExecutionPolicy Bypass -File tools\\validate-doc-links.ps1`
