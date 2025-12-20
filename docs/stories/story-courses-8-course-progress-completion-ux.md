# STORY-COURSES-8: Course Progress & Completion UX (MVP)

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Потребителят да вижда прогреса си в курса и кои curriculum items са завършени, както и да има ясен „completion loop“ до сертификат (ако е завършил курса).

---

## 2. Non-Goals

- Нови BE endpoints (използваме наличните)
- PDF/verification за сертификат
- UI за tasks/quizzes (покриваме wiki items за MVP)

---

## 3. Acceptance Criteria

### 3.1 Course Detail Progress Panel

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `/courses/:courseId` показва progress panel за логнат потребител | ✅ |
| AC-2 | Panel-ът показва progress bar и % | ✅ |
| AC-3 | Panel-ът показва списък с items и completed индикатор | ✅ |
| AC-4 | При 100% прогрес показва CTA към сертификат | ✅ |

### 3.2 Errors / Edge cases

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Ако user не е логнат → показва кратко съобщение/линк към login | ✅ |
| AC-6 | Ако няма enrollment (403) → показва съобщение | ✅ |

### 3.3 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | FE unit test покрива render на progress panel + certificate CTA | ✅ |

---

## 4. Implementation Notes

- Endpoint: `GET /api/courses/:courseId/curriculum/progress`
- Enrollment status се обновява server-side при `POST /api/courses/:courseId/curriculum/:itemId/complete`

---

## 5. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec |
| 2025-12-20 | Cascade | Marked as implemented (all AC ✅) |
