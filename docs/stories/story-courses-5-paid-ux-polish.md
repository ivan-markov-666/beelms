# STORY-COURSES-5: Paid UX Polish

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Подобряване на UX за платени курсове (след STORY-COURSES-4), така че потребителят ясно да вижда дали курсът е платен/безплатен и какво точно се случва при записване (unlock vs enroll).

---

## 2. Non-Goals

- Интеграция с payment provider
- Pricing, промоции, валута
- Админ UI за покупки

---

## 3. Acceptance Criteria

### 3.1 Catalog + Detail Badges

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `/courses` показва badge `Paid` или `Free` за всеки курс | ✅ |
| AC-2 | `/courses/:courseId` показва badge `Paid` или `Free` | ✅ |

### 3.2 Enroll Button States & Messaging

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | За paid курс бутонът показва отделни стейтове: `Unlocking…` и после `Enrolling…` | ✅ |
| AC-4 | Success message е по-ясен за paid курс (unlock + enroll) | ✅ |
| AC-5 | Error message е по-ясен при проблем в unlock или enroll | ✅ |

### 3.3 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | Има FE unit test за paid flow (purchase → enroll) | ✅ |
| AC-7 | Има FE unit test за free flow (direct enroll) | ✅ |

---

## 4. Implementation Notes

- FE: `EnrollCourseButton` ще поддържа вътрешен status (`idle` / `unlocking` / `enrolling`).
- FE: `CourseSummary` type ще включва `isPaid`, и в catalog/detail ще се визуализира badge.

---

## 5. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec |
| 2025-12-20 | Cascade | Marked as implemented (all AC ✅) |
