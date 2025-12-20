# STORY-PAYMENTS-1: Stripe Checkout (Test Mode) for Paid Courses

_BMAD Story Spec | EPIC: EPIC-COURSES-PAID | Status: 🟡 In Progress_

---

## 1. Goal

Да заменим „fake purchase“ с реален payment flow за paid courses, използвайки **Stripe Checkout (test mode)**.

---

## 2. Approach (MVP, no webhooks)

За MVP избягваме Stripe webhooks (raw body parsing) и правим verify стъпка след redirect:

1. FE натиска “Unlock/Pay”
2. BE създава Stripe Checkout Session и връща `url`
3. FE redirect към Stripe
4. Stripe връща към FE `success_url` със `session_id`
5. FE вика BE verify endpoint → BE проверява session status през Stripe API и записва `CoursePurchase`
6. FE вика `POST /api/courses/:courseId/enroll`

---

## 3. Acceptance Criteria

### 3.1 Backend

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Добавен Stripe SDK dependency в BE | ⬜ |
| AC-2 | `POST /api/courses/:courseId/checkout` (JWT) връща Stripe Checkout URL за paid course | ⬜ |
| AC-3 | `POST /api/courses/:courseId/purchase/verify` (JWT) валидира `session_id` и записва `CoursePurchase` | ⬜ |
| AC-4 | Ако Stripe env липсва → 501/400 с ясна грешка | ⬜ |
| AC-4.1 | Има `payment_settings` таблица (singleton) за currency | ⬜ |
| AC-4.2 | Admin може да сменя currency през `GET/PATCH /api/admin/payments/settings` | ⬜ |
| AC-4.3 | Admin може да изтегли списък валути през `GET /api/admin/payments/currencies` | ⬜ |
| AC-4.4 | Admin може да сменя цена (cents) през `PATCH /api/admin/payments/settings` | ⬜ |
| AC-4.5 | Paid course може да има `currency` + `priceCents` (per-course pricing) | ⬜ |
| AC-4.6 | Stripe checkout използва per-course pricing; ако липсва → fallback към `payment_settings` | ⬜ |

### 3.2 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Paid flow редиректва към Stripe Checkout | ⬜ |
| AC-6 | След success redirect: verify purchase → enroll → показва success state | ⬜ |
| AC-7 | Cancel/failed payment дава ясна грешка и позволява retry | ⬜ |

### 3.3 Env / Config

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Документирани env vars: `STRIPE_SECRET_KEY`, `FRONTEND_ORIGIN`, `STRIPE_COURSE_PRICE_CENTS` | ⬜ |

### 3.4 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | BE unit/e2e test за verify endpoint (happy path + invalid session) | ⬜ |

---

## 4. Open Questions

- Каква валута/сума ползваме за MVP (пример: `EUR 9.99` или `BGN 19.99`)?
- Какъв е app URL за success/cancel (localhost само или ще има staging URL)?

---

## 5. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec |
