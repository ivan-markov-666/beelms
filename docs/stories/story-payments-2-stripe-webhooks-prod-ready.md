# STORY-PAYMENTS-2: Stripe Webhooks (Prod-ready)

_BMAD Story Spec | EPIC: EPIC-COURSES-PAID | Status: 🟢 Implemented_

---

## 1. Goal

Да направим Stripe payment flow-а устойчив за production чрез **Stripe webhooks** (source of truth), така че покупките да се записват коректно дори ако:

- FE не успее да извика verify endpoint (tab close / network error)
- Stripe payment е async / delayed
- има race conditions между verify и webhook
- има retry-и от Stripe (дубликати на event-и)

---

## 2. Non-Goals

- Refunds / disputes / chargebacks (отделна story)
- Subscriptions / invoices
- Admin UI за покупки и reconciliation dashboard
- Пълна event coverage за всички Stripe event-и (покриваме MVP event set)

---

## 3. Acceptance Criteria

### 3.1 Backend (Webhooks)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има endpoint `POST /api/payments/webhook` (без auth) с Stripe signature verification | ✅ |
| AC-2 | Raw body parsing е конфигуриран така, че Stripe signature да се валидира коректно | ✅ |
| AC-3 | Обработваме поне: `checkout.session.completed` и записваме `CoursePurchase` (idempotent) | ✅ |
| AC-4 | Webhook handler е idempotent на ниво Stripe event (ако Stripe retry-не същия event, няма side effects) | ✅ |
| AC-5 | Webhook handler е safe при race conditions с verify endpoint (no duplicates / consistent result) | ✅ |
| AC-6 | Ясни логове при: invalid signature, unknown event type, missing metadata | 🟡 |

### 3.2 Backend (Data model)

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | Има таблица `stripe_webhook_events` (или еквивалент) за dedupe по `event.id` | ✅ |
| AC-8 | Таблицата пази статус: processed / failed + error payload (за debugging) | ✅ |

### 3.3 Frontend (Behavior)

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | FE остава с verify flow-а, но UI/logic не се чупи ако purchase вече е записан от webhook | ✅ |

### 3.4 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | BE e2e тест: valid webhook event → purchase записан | ✅ |
| AC-11 | BE e2e тест: duplicate event (same `event.id`) → purchase не се дублира + event dedupe работи | ✅ |
| AC-12 | BE e2e тест: invalid signature → 400 | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Controller:
  - `be/src/payments/payments-webhook.controller.ts`
    - `POST /api/payments/webhook`
- Service:
  - `be/src/payments/payments.service.ts` (или отделен `payments-webhook.service.ts`)
- Entities / migrations:
  - new entity: `StripeWebhookEvent`
  - new migration: create `stripe_webhook_events` with UNIQUE(event_id)

### 4.2 Signature verification

- Env var:
  - `STRIPE_WEBHOOK_SECRET`
- Raw body:
  - в NestJS трябва да пазим raw body за този route (пример: middleware/adapter hook), иначе Stripe signature verification ще fail-не.

### 4.3 Event mapping (MVP)

- `checkout.session.completed`
  - очакваме `metadata: { courseId, userId }`
  - валидираме `payment_status` (или equivalent) и записваме `CoursePurchase`

---

## 5. Test Plan

### 5.1 Local manual test

1) Стартирай BE/DB локално
2) Използвай Stripe CLI:
   - `stripe listen --forward-to localhost:3000/api/payments/webhook`
3) Направи test checkout (както в текущия flow)
4) Потвърди в DB че purchase е записан

### 5.2 Automated tests

- Stripe SDK mock + контролирано `constructEvent`
- e2e сценарии за:
  - happy path
  - invalid signature
  - duplicate webhook event

---

## 6. Questions / Inputs Needed

- Какъв ще е публичният webhook URL (за Stripe Dashboard / Stripe CLI)?
- Ще ползваме ли Stripe CLI локално (препоръчително) или само mock-ове?
- Искаш ли да покрием и `checkout.session.async_payment_succeeded` за async методи, или MVP само `checkout.session.completed`?

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-20 | Cascade | Initial story spec |
| 2025-12-21 | Cascade | Marked acceptance criteria statuses after implementation |
