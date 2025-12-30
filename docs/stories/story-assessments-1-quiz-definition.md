# STORY-ASSESSMENTS-1: Quiz definition (questions/options)

_BMAD Story Spec | EPIC: EPIC-CORE-ASSESSMENTS | Status: ✅ Implemented_

---

## 1. Goal

Да се моделират и управляват quiz-овете (MVP: Multiple Choice / Single correct answer) така, че admin-ите да могат да дефинират въпроси, опции и правилни отговори, а курсовете да ги реферират в curriculum-а.

---

## 2. Non-Goals

- Adaptive quizzes, randomization
- Question banks / tagging
- Partial scoring или multiple correct answers
- Import/export от външни системи

---

## 3. Acceptance Criteria

### 3.1 Data Model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Нови таблици `quiz`, `quiz_question`, `quiz_option` (1:N:N) | ✅ |
| AC-2 | Въпросът съдържа `title`, `description`, `order`, `correctOptionId` | ✅ |
| AC-3 | Вариантите съдържат `text`, `order` и са обвързани с въпроса | ✅ |
| AC-4 | Има foreign key към course curriculum item (quiz може да се ползва в няколко курса) | ✅ |

### 3.2 Admin API

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | `GET /api/admin/quizzes` (list) + filters по status/language | ✅ |
| AC-6 | `GET /api/admin/quizzes/:quizId` връща quiz + questions + options | ✅ |
| AC-7 | `POST /api/admin/quizzes` създава quiz + въпроси + опции в една заявка | ✅ |
| AC-8 | `PATCH /api/admin/quizzes/:quizId` позволява update (add/update/remove въпроси и опции) | ✅ |
| AC-9 | API валидира, че `correctOptionId` принадлежи към съответния въпрос | ✅ |

### 3.3 Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Admin Quiz list показва език, брой въпроси, статус | ✅ |
| AC-11 | Quiz editor има drag/drop за подредба на въпроси и опции | ✅ |
| AC-12 | Въпросите могат да се маркират като draft / published | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- Entities: `QuizEntity`, `QuizQuestionEntity`, `QuizOptionEntity`
- Controller: `be/src/assessments/admin-quizzes.controller.ts`
- Service: `be/src/assessments/admin-quizzes.service.ts`
- DTOs: `CreateQuizDto`, `UpdateQuizDto`

### Frontend
- Pages: `fe/src/app/admin/quizzes/page.tsx`, `fe/src/app/admin/quizzes/create/page.tsx`, `fe/src/app/admin/quizzes/[quizId]/edit/page.tsx`
- Components: `QuizQuestionForm`, `QuizOptionInput`

### Tests
- BE e2e: `be/test/admin-quizzes.e2e-spec.ts`
- FE unit: `quiz-question-form.test.tsx`

---

## 5. Notes
- Quiz езикът следва езика на курса, но може да има собствени преводи post-MVP.
- Curriculum item реферира quizId; remove на quiz е забранен ако е използван – вместо това `status=inactive`.
