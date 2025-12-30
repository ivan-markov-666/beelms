# STORY-TASKS-1: Task item in Course (MVP)

_BMAD Story Spec | EPIC: EPIC-CORE-TASKS | Status: ✅ Implemented_

---

## 1. Goal

Да се добави нов вид curriculum item `task`, който реферира към отделна `Task` entity (title/description), и да има Admin възможност за създаване/редакция на tasks и свързването им към курсове.

---

## 2. Non-Goals

- Автоматична проверка/оценяване на решения
- Upload на файлове, code runner, peer review
- Complex workflow (subtasks, deadlines, comments)

---

## 3. Acceptance Criteria

### 3.1 Task Entity (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има `Task` entity (id, title, description, status, language, timestamps) | ✅ |
| AC-2 | Има migration за `tasks` таблица | ✅ |

### 3.2 Admin Task CRUD (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | `GET /api/admin/tasks` list | ✅ |
| AC-4 | `POST /api/admin/tasks` create | ✅ |
| AC-5 | `GET /api/admin/tasks/:taskId` detail | ✅ |
| AC-6 | `PATCH /api/admin/tasks/:taskId` update | ✅ |
| AC-7 | `DELETE /api/admin/tasks/:taskId` delete | ✅ |

### 3.3 Curriculum linking

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Admin може да добавя curriculum item тип `task` с `taskId` | ✅ |
| AC-9 | При create/update curriculum item `task` се валидира, че `taskId` съществува и е активен | ✅ |

### 3.4 Security

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Всички admin task endpoints изискват JWT + admin role | ✅ |

---

## 4. Current State in Codebase

- Curriculum schema вече поддържа `itemType: 'task'` и поле `taskId`:
  - `be/src/courses/course-curriculum-item.entity.ts`
  - `be/src/courses/dto/admin-create-course-curriculum-item.dto.ts`
  - `be/src/courses/dto/admin-update-course-curriculum-item.dto.ts`
- Има `Task` entity и admin endpoints за tasks:
  - `be/src/tasks/task.entity.ts`
  - `be/src/tasks/admin-tasks.controller.ts`
  - `be/src/tasks/admin-tasks.service.ts`
  - `be/src/tasks/dto/admin-task.dto.ts`
- Има admin UI за tasks:
  - `fe/src/app/admin/tasks/page.tsx`
  - `fe/src/app/admin/tasks/[taskId]/page.tsx`
- Има learner task detail view (JWT):
  - `be/src/courses/courses.controller.ts` → `GET /api/courses/:courseId/tasks/:taskId`
  - `fe/src/app/courses/[courseId]/tasks/[taskId]/page.tsx`

---

## 5. Implementation Notes

- `Task` status да е подобен на course/wiki/quiz (`draft/active/inactive`) за консистентност.
- Curriculum validation да следва модела на quiz validation в `CoursesService.validateCurriculumRefs`.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec for TASKS-1 |
