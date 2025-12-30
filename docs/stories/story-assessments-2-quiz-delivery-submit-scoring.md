# STORY-ASSESSMENTS-2: Quiz delivery + submit + scoring

_BMAD Story Spec | EPIC: EPIC-CORE-ASSESSMENTS | Status: ✅ Implemented_

---

## 1. Goal

Да позволи на записаните потребители да отварят quiz от курс, да изпращат отговорите си и да получават незабавен резултат (pass/fail), който влияе върху прогреса на курса.

---

## 2. Non-Goals

- Anonymous/guest quiz attempts
- Partial credit или много правилни отговори
- Review mode с показване на правилните отговори (post-MVP)

---

## 3. Acceptance Criteria

### 3.1 Delivery API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/courses/:courseId/quizzes/:quizId` връща quiz данни (title, questions, shuffled options=false) само ако потребителят е записан в курса | ✅ |
| AC-2 | Endpoint отказва достъп при незаписан потребител (403) или невалиден quiz (404) | ✅ |
| AC-3 | Response НЕ съдържа информация за правилния отговор | ✅ |

### 3.2 Submit & Scoring

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | `POST /api/courses/:courseId/quizzes/:quizId/submit` приема масив `{ questionId, optionId }` | ✅ |
| AC-5 | Backend валидира, че всички пращани въпроси принадлежат на quiz-а | ✅ |
| AC-6 | Резултатът включва `scorePercent`, `correctCount`, `totalQuestions`, `passed` (threshold 80%) | ✅ |
| AC-7 | При repeat опит се създава нов attempt (виж STORY-ASSESSMENTS-3), но най-новият резултат се връща веднага | ✅ |

### 3.3 Frontend UX

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Quiz страница показва въпросите един под друг, radio buttons за опции, CTA „Submit“ | ✅ |
| AC-9 | След успешно submit UI показва резултат (pass/fail banner) + CTA „Return to course“ | ✅ |
| AC-10 | Error handling: expired session → redirect към login; validation errors → inline | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- Controller: `be/src/assessments/quizzes.controller.ts`
- Service: `be/src/assessments/quizzes.service.ts` (`getQuizForUser`, `submitQuizAttempt`)
- Guards: `JwtAuthGuard` (require enrollment)
- DTOs: `SubmitQuizDto`

### Frontend
- Page: `fe/src/app/courses/[courseId]/quizzes/[quizId]/page.tsx`
- Components: `QuizQuestionPlayer`, `QuizResultBanner`
- Hooks: `useQuizPlayer`

### Tests
- BE e2e: `be/test/quizzes.e2e-spec.ts`
- FE unit/integration: `quiz-question-player.test.tsx`

---

## 5. Notes
- Прогресът в курса се обновява чрез `CourseProgressService` след submit (pass → mark quiz item complete).
- Submissions са rate-limited (max 5/min) за да се предотврати brute force на отговори.
