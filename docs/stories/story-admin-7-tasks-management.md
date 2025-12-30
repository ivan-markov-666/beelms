# STORY-ADMIN-7: Admin Tasks management (CRUD + status)

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Да предоставим администраторски CRUD за **Task templates**, които се използват като curriculum items в курсовете.

---

## 2. Non-Goals

- Потребителски UI за изпълнение на задачите (покрито от EPIC-CORE-TASKS)
- Сложни типове задачи (file upload, auto-grading)
- Multi-tenant / ownership permissions (само admin)

---

## 3. Acceptance Criteria

### 3.1 Admin API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/tasks` връща списък с tasks (id/title/description/language/status/createdAt/updatedAt) | ✅ |
| AC-2 | `POST /api/admin/tasks` създава task и връща новия запис | ✅ |
| AC-3 | `GET /api/admin/tasks/:taskId` връща task детайл | ✅ |
| AC-4 | `PATCH /api/admin/tasks/:taskId` обновява task полета (partial update) и връща обновения запис | ✅ |
| AC-5 | `DELETE /api/admin/tasks/:taskId` изтрива task и връща 204 | ✅ |
| AC-6 | Всички endpoints изискват JWT + admin (`JwtAuthGuard` + `AdminGuard`) | ✅ |
| AC-7 | Validation: `title` (max 255), `description` required, `language` (max 10), `status` ∈ {draft,active,inactive} | ✅ |

### 3.2 Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | `/admin/tasks` показва списък + форма за създаване на task | ✅ |
| AC-9 | От списъка има navigation към `/admin/tasks/:taskId` за редакция | ✅ |
| AC-10 | `/admin/tasks/:taskId` позволява edit + save + delete (с confirm) | ✅ |
| AC-11 | UI има loading/error/success states при fetch/save/delete | ✅ |

---

## 4. Technical Implementation (Where)

### Backend

- Entity: `be/src/tasks/task.entity.ts`
- Module: `be/src/tasks/tasks.module.ts`
- Controller: `be/src/tasks/admin-tasks.controller.ts`
- Service: `be/src/tasks/admin-tasks.service.ts`
- DTO/validation: `be/src/tasks/dto/admin-task.dto.ts`

### Frontend

- List + create: `fe/src/app/admin/tasks/page.tsx`
- Detail + edit/delete: `fe/src/app/admin/tasks/[taskId]/page.tsx`

### Tests

- BE e2e: `be/test/admin-tasks.e2e-spec.ts`

---

## 5. Notes

- Curriculum items от тип `task` валидират `taskId` да сочи към `active` task при добавяне към курс.
