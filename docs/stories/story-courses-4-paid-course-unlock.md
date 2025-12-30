# STORY-COURSES-4: Paid Course Unlock (MVP)

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Позволява на потребител да „отключи“ платен курс чрез **Stripe Checkout** (redirect flow), след което да може да се запише (enroll) и да консумира съдържанието.

---

## 2. Non-Goals

- Refunds / subscriptions / invoices
- Админ UI за покупки


---

## 3. Acceptance Criteria

### 3.1 Purchase / Unlock (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `POST /api/courses/:courseId/checkout` (JWT) връща `url` за Stripe Checkout session | ✅ |
| AC-2 | `POST /api/courses/:courseId/purchase/verify` (JWT) валидира `sessionId` и записва `CoursePurchase` | ✅ |
| AC-3 | `GET /api/payments/courses/:courseId/purchase/status` (JWT) връща `{ purchased: boolean }` | ✅ |
| AC-4 | Checkout/verify за free курс връща 400 | ✅ |
| AC-5 | Checkout/verify за невалиден/неактивен курс връща 404 | ✅ |
| AC-6 | Checkout/verify без token връща 401 | ✅ |

### 3.2 Enrollment for Paid Course (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | `POST /api/courses/:courseId/enroll` за paid курс връща 403, ако няма purchase | ✅ |
| AC-8 | След purchase, enroll за paid курс връща 204 | ✅ |

### 3.3 Database

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | Създадена е таблица `course_purchases` с UNIQUE(course_id, user_id) | ✅ |

### 3.4 UI (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | `/courses/:courseId` показва бутон за enroll, който за paid курс започва checkout flow | ✅ |
| AC-11 | `/courses/:courseId/checkout/success` прави verify → изчаква purchase → enroll → показва success | ✅ |
| AC-12 | `/courses/:courseId/checkout/cancel` показва cancel state и линк за retry | ✅ |
| AC-13 | При липса на token, UI насочва към login | ✅ |

---

## 4. Technical Implementation

### 4.1 Backend

- Entity: `be/src/courses/course-purchase.entity.ts`
- Migration: `be/src/migrations/1765935000000-InitCoursePurchaseSchema.ts`
- Checkout/verify endpoints:
  - `be/src/payments/payments.controller.ts`
    - `POST /api/courses/:courseId/checkout`
    - `POST /api/courses/:courseId/purchase/verify`
- Purchase status endpoint:
  - `be/src/payments/payments-webhook.controller.ts`
    - `GET /api/payments/courses/:courseId/purchase/status`
- Enroll gate:
  - `be/src/courses/courses.service.ts` → `enrollInCourse()` проверява purchase при `course.isPaid === true`

### 4.2 Frontend

- Button: `fe/src/app/courses/_components/enroll-course-button.tsx`
  - при paid курс вика `POST /courses/:courseId/checkout` и redirect-ва към Stripe
- Detail page: `fe/src/app/courses/[courseId]/page.tsx`
  - подава `isPaid` към бутона
- Checkout pages:
  - `fe/src/app/courses/[courseId]/checkout/success/page.tsx`
  - `fe/src/app/courses/[courseId]/checkout/cancel/page.tsx`

### 4.3 Tests

- `be/test/course-enrollment.e2e-spec.ts` (paid enroll gate)
- `be/test/payments.e2e-spec.ts` / `be/test/payments-stripe-mock.e2e-spec.ts` (checkout/verify)

---

## 5. Manual Smoke Test

1) Създай paid курс (admin)
2) Отвори `/courses/:id`
3) Натисни `Pay & Enroll`
4) Увери се, че курсът се появява в `/my-courses`

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec + implementation work |
| 2025-12-20 | Cascade | Marked as implemented (all AC ✅) |
