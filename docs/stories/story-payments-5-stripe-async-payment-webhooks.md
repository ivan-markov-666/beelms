# STORY-PAYMENTS-5: Stripe Async Payment Webhooks

_BMAD Story Spec | EPIC: EPIC-PAYMENTS-OPS | Status: 🟢 Done_

---

## 1. Goal

Да покрием Stripe async payment сценарии при Checkout, така че purchase-ите да се записват коректно и при delayed payment методи.

---

## 2. Non-Goals

- Refunds / disputes / chargebacks (отделна story)
- Subscriptions
- Admin reconciliation UI

---

## 3. Acceptance Criteria

### 3.1 Backend (Webhooks)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Обработваме `checkout.session.async_payment_succeeded` и записваме `CoursePurchase` (idempotent) | ✅ |
| AC-2 | Обработваме `checkout.session.async_payment_failed` и маркираме `StripeWebhookEvent` като failed с reason | ✅ |
| AC-3 | И при двата event-а валидираме `metadata: { courseId, userId }` | ✅ |
| AC-4 | И при двата event-а обработката е idempotent на ниво `event.id` | ✅ |
| AC-5 | Unknown event types се маркират processed (no-op), без side effects | ✅ |

### 3.2 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | BE e2e тест: async_payment_succeeded webhook → purchase записан | ✅ |
| AC-7 | BE e2e тест: async_payment_failed webhook → event status=failed + error записан | ✅ |

---

## 4. Technical Notes

- Използваме съществуващия webhook endpoint `POST /api/payments/webhook`.
- Event payload се записва (sanitized) в `stripe_webhook_events.event_payload`.
- При failed event, записваме `error_message` и `error_stack`.

---

## 5. Test Plan

- Stripe SDK mock (`constructEvent`) + контролирани payload-и.
- e2e сценарии:
  - async succeeded → purchase
  - async failed → failed event
