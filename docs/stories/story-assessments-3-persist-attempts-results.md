# STORY-ASSESSMENTS-3: Persist quiz attempts & results

_BMAD Story Spec | EPIC: EPIC-CORE-ASSESSMENTS | Status: ✅ Implemented_

---

## 1. Goal

Да се съхраняват quiz attempts (кой потребител, кой курс, резултат, отговори), за да можем:
- да показваме историята на опитите;
- да използваме данните за прогрес и бъдещи метрики;
- да предотвратим повторно използване на стари резултати след промени в quiz-а.

---

## 2. Non-Goals

- Визуализация на детайлна история в FE (post-MVP)
- Review на грешни отговори
- Export на attempts

---

## 3. Acceptance Criteria

### 3.1 Data model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Таблица `quiz_attempts` със следните полета: `id`, `user_id`, `course_id`, `quiz_id`, `score_percent`, `correct_count`, `total_questions`, `passed`, `submitted_at` | ✅ |
| AC-2 | Таблица `quiz_attempt_answers` съхранява въпрос/опция за всеки attempt | ✅ |
| AC-3 | Индекс върху `(user_id, quiz_id)` за бързо извличане на последния резултат | ✅ |

### 3.2 Service logic

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | При submit (STORY-ASSESSMENTS-2) се създава нов attempt и се записват отговорите | ✅ |
| AC-5 | При промяна на quiz-а (нови въпроси/опции) старите attempts запазват историята си; не се over-write-ват | ✅ |
| AC-6 | `GET /api/courses/:courseId/quizzes/:quizId/attempts/latest` връща последния attempt (pass/fail) и timestamp | ✅ |

### 3.3 Admin reporting hooks

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | Admin Metrics API може да извлича общ брой attempts и pass rate (хранилище за бъдещ MTX story) | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- Entities: `QuizAttemptEntity`, `QuizAttemptAnswerEntity`
- Service: `quizzes.service.ts` (`recordQuizAttempt`, `getLatestAttempt`)
- Repository: custom query builders в `quiz-attempt.repository.ts`
- Migration: `1766001000000-AddQuizAttempts.ts`

### Frontend (optional usage)
- `My Courses` секция показва `Last attempt: Passed/Failed on <date>` когато данните са налични

### Tests
- BE e2e: `be/test/quizzes.e2e-spec.ts` (submit multi attempts + latest endpoint)
- Unit: `quiz-attempt.repository.spec.ts`

---

## 5. Notes
- Attempts се третират като immutable записи; при delete на user трябва да се анонимизират (вкл. GDPR story).
- Данните могат да захранят бъдещи learning analytics (MTX epic).
