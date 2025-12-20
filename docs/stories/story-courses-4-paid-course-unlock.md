# STORY-COURSES-4: Paid Course Unlock (MVP)

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Позволява на потребител да „отключи“ платен курс (MVP purchase без външен payment provider), след което да може да се запише (enroll) и да консумира съдържанието.

---

## 2. Non-Goals

- Реална интеграция с payment provider (Stripe, myPOS, PayPal)
- Refunds / subscriptions / invoices
- Админ UI за покупки

---

## 3. Acceptance Criteria

### 3.1 Purchase / Unlock (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `POST /api/courses/:courseId/purchase` създава purchase record за paid курс | ✅ |
| AC-2 | Purchase е idempotent (повторно викане не създава duplicate) | ✅ |
| AC-3 | Purchase за free курс връща 400 | ✅ |
| AC-4 | Purchase за невалиден/неактивен курс връща 404 | ✅ |
| AC-5 | Purchase без token връща 401 | ✅ |

### 3.2 Enrollment for Paid Course (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | `POST /api/courses/:courseId/enroll` за paid курс връща 403, ако няма purchase | ✅ |
| AC-7 | След purchase, enroll за paid курс връща 204 | ✅ |

### 3.3 Database

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Създадена е таблица `course_purchases` с UNIQUE(course_id, user_id) | ✅ |

### 3.4 UI (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | `/courses/:courseId` показва бутон за enroll, който за paid курс прави unlock + enroll | ✅ |
| AC-10 | При липса на token, UI насочва към login | ✅ |

---

## 4. Technical Implementation

### 4.1 Backend

- Entity: `be/src/courses/course-purchase.entity.ts`
- Migration: `be/src/migrations/1765935000000-InitCoursePurchaseSchema.ts`
- Endpoint: `POST /api/courses/:courseId/purchase`
  - `be/src/courses/courses.controller.ts`
  - `be/src/courses/courses.service.ts` → `purchaseCourse()`
- Enroll gate:
  - `be/src/courses/courses.service.ts` → `enrollInCourse()` проверява purchase при `course.isPaid === true`

### 4.2 Frontend

- Button: `fe/src/app/courses/_components/enroll-course-button.tsx`
  - приема `isPaid` и при нужда вика `/courses/:courseId/purchase` преди enroll
- Detail page: `fe/src/app/courses/[courseId]/page.tsx`
  - подава `isPaid` към бутона

### 4.3 Tests

- `be/test/course-enrollment.e2e-spec.ts`
  - добавен сценарий „purchase → enroll“

---

## 5. Manual Smoke Test

1) Създай paid курс (admin)
2) Отвори `/courses/:id`
3) Натисни `Unlock & Enroll`
4) Увери се, че курсът се появява в `/my-courses`

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec + implementation work |
| 2025-12-20 | Cascade | Marked as implemented (all AC ✅) |
