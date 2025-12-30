# STORY-DOCS-1: OpenAPI Sync (API Contract as Source of Truth)

_BMAD Story Spec | EPIC: EPIC-CORE-API-CONTRACT | Status: 🟡 Planned_

---

## 1. Goal

Да гарантираме, че `docs/architecture/openapi.yaml` отразява **реално наличните MVP endpoints** и може да се ползва като API contract.

Особено важно за:

- integrators/consumers на headless API
- DoD (ясен контракт + примери)
- избягване на drift между код и документация

---

## 2. Non-Goals

- Автоматично генериране на OpenAPI от decorators (Nest Swagger module)
- Пълно описание на post-MVP endpoints

---

## 3. Acceptance Criteria

### 3.1 Contract completeness

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | OpenAPI включва `GET /api/health` | ⬜ |
| AC-2 | OpenAPI включва payments/admin-payments endpoints, които са част от MVP scope (ако са shipped) | ⬜ |
| AC-3 | OpenAPI включва analytics endpoints (ако са shipped) | ⬜ |
| AC-4 | OpenAPI включва admin settings/legal endpoints (след STORY-SETTINGS-2/3) | ⬜ |
| AC-5 | OpenAPI включва course categories endpoints (след STORY-COURSES-10) | ⬜ |

### 3.2 Contract quality

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | Всички endpoints имат summary + основни responses (200/201/204 + 400/401/403/404) | ⬜ |
| AC-7 | Има дефинирани schemas/DTO shapes за новите endpoints | ⬜ |
| AC-8 | `servers` и `/api` prefix е консистентен с `be/src/main.ts` | ⬜ |

### 3.3 Validation

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | В CI има стъпка, която валидира YAML (lint/parse) и fail-ва при невалидна спецификация | ⬜ |

---

## 4. Technical Implementation (Where)

- Main doc:
  - `docs/architecture/openapi.yaml`
- CI:
  - add validation step (например `swagger-cli validate` или simple Node YAML parse) в `.github/workflows/ci.yml`.

---

## 5. Test Plan

- CI pipeline run: OpenAPI validate step passes.
- Manual: open спецификацията в Swagger UI/Stoplight → основните endpoints се визуализират.

---

## 6. Notes

- Ако някои endpoints са съзнателно “internal only”, трябва да са маркирани като такива или да се извадят от OpenAPI.

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Created story spec for keeping OpenAPI in sync with MVP endpoints |
