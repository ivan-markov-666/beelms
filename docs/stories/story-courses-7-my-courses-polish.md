# STORY-COURSES-7: My Courses Dashboard Polish

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: 🟡 In Progress_

---

## 1. Goal

Подобряване на `/my-courses` така че потребителят да вижда бързо:

- дали курсът е Paid/Free
- напредък (progress bar)
- ясни CTA според статуса (Continue / Certificate)

---

## 2. Non-Goals

- Нови BE endpoints (използваме съществуващите `/api/users/me/courses` и certificate endpoint)
- Редактиране на curriculum / progress логика

---

## 3. Acceptance Criteria

### 3.1 UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Картата показва badge `Paid`/`Free` | ✅ |
| AC-2 | Картата показва progress bar (0-100) ако `progressPercent` е наличен | ✅ |
| AC-3 | Enrollment статусът е user-friendly label (BG) | ✅ |
| AC-4 | За `completed` курс има CTA “Certificate” | ✅ |
| AC-5 | За `in_progress`/`not_started` има CTA “Continue/Open course” | ✅ |

### 3.2 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | FE unit test покрива render на paid/free badge + certificate CTA for completed | ✅ |

---

## 4. Implementation Notes

- Използваме `isPaid` от `CourseSummaryDto`, което вече се връща в `/api/users/me/courses`.
- `progressPercent` е вече налично в API.

---

## 5. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec |
