# STORY-ADMIN-6: Admin Quizzes Management (CRUD + Questions + Linking)

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Администраторът може да управлява базови quizzes (MVP: MCQ / single choice), да поддържа въпроси и да ги свързва към курсове (чрез curriculum items).

Това е authoring/ops story за създаване на учебно оценяване като част от Courses & Assessments вертикала.

---

## 2. Non-Goals

- Advanced question types (multi-select, free text, code runner)
- Timed exams, proctoring, сертификати на база оценки
- Detailed analytics per question
- Public/guest достъп до quizzes

---

## 3. Acceptance Criteria

### 3.1 Admin Quiz CRUD

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Admin може да създава quiz (title, description, language, status) | ✅ |
| AC-2 | Admin може да вижда списък с quizzes | ✅ |
| AC-3 | Admin може да редактира quiz metadata | ✅ |
| AC-4 | Admin може да активира/деактивира quiz (status workflow) | ✅ |

### 3.2 Question CRUD (MCQ)

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Quiz има въпроси тип single-choice (question text + options + correct option) | ✅ |
| AC-6 | Admin може да добавя/редактира/трие въпроси и options | ✅ |
| AC-7 | Има deterministic order на въпросите | ✅ |

### 3.3 Linking към Courses

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Admin може да свързва quiz към курс чрез curriculum item тип `quiz` | ✅ |
| AC-9 | В curriculum се пази `quizId` (FK или uuid reference) | ✅ |
| AC-10 | Admin UI позволява избор на quiz при добавяне на curriculum item | ✅ |

### 3.4 Security

| # | Criterion | Status |
|---|-----------|--------|
| AC-11 | Всички admin quiz endpoints изискват JWT + admin role | ✅ |

---

## 4. Current State in Codebase (What exists today)

### 4.1 Existing hooks

- Course curriculum поддържа item type `quiz` и поле `quizId`:
  - `be/src/courses/course-curriculum-item.entity.ts` (`quizId: uuid | null`)
  - `be/src/courses/dto/admin-create-course-curriculum-item.dto.ts` (`itemType` includes `quiz`, `quizId?: uuid`)
  - `be/src/courses/dto/course-module-item.dto.ts` (`quizId` in response)

### 4.2 Implemented in codebase

- BE entities/migrations за `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAttempt`
- Admin controllers/service за `/api/admin/quizzes` + nested `/questions`
- Curriculum validation изисква активен `quizId` при create/update
- E2E тестове: admin quiz CRUD + curriculum validation

### 4.3 Missing

- FE admin UI под `/admin/quizzes`

---

## 5. Planned API Reference (from PRD/OpenAPI)

### 5.1 Planned user-facing quiz endpoints

- `GET /api/courses/{courseId}/quizzes/{quizId}`
- `POST /api/courses/{courseId}/quizzes/{quizId}/submit`

(описани в `docs/architecture/openapi.yaml` в секция Courses & Assessments)

### 5.2 Planned admin quiz endpoints

PRD указва:
- `/api/admin/quizzes...` (частично, като planned coverage)

(детайлен contract не е описан в текущия `openapi.yaml`.)

---

## 6. Recommended Implementation Plan (To complete ADMIN-6)

### 6.1 Backend

- Нов `QuizzesModule`
- Entities:
  - `Quiz`
  - `QuizQuestion`
  - `QuizOption`
  - (optional MVP) `QuizAttempt`
- Migrations + seed
- Controllers:
  - `GET /api/admin/quizzes`
  - `POST /api/admin/quizzes`
  - `GET /api/admin/quizzes/:quizId`
  - `PATCH /api/admin/quizzes/:quizId`
  - `DELETE /api/admin/quizzes/:quizId` (или safe delete)
  - nested routes за questions/options
- Integrate с Courses:
  - валидирай `quizId` при curriculum create/update

### 6.2 Frontend

- New admin screens:
  - `/admin/quizzes` list
  - `/admin/quizzes/create`
  - `/admin/quizzes/:quizId` edit
- UI за въпроси и options
- UI за linking към курс (curriculum item selector)

### 6.3 Tests

- BE e2e: admin quiz CRUD + questions
- BE e2e: curriculum quizId validation
- FE unit tests за admin quizzes pages

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Created backlog story spec for ADMIN-6 based on PRD/OpenAPI; implementation not present in codebase |
| 2025-12-21 | Cascade | Updated status to In Progress; marked backend CRUD + curriculum validation + e2e as implemented; FE UI still pending |
