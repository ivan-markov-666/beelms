# STORY-PAYMENTS-6: Payments Ops - Reconciliation & Retry Tooling (MVP)

_BMAD Story Spec | EPIC: EPIC-PAYMENTS-OPS | Status: 🟢 Done_

---

## 1. Goal

Да имаме минимални admin инструменти за:

- видимост върху failed Stripe webhook events
- безопасен retry на processing за определени event-и

Целта е бързо дебъгване и recovery в dev/staging без ръчни DB операции.

---

## 2. Non-Goals

- Admin UI (ще ползваме endpoint-и и manual calls)
- Bulk retry / scheduled jobs
- Full reconciliation между Stripe и DB (по-голяма story)

---

## 3. Acceptance Criteria

### 3.1 Backend (Admin endpoints)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/payments/webhook-events?status=failed` връща списък с `StripeWebhookEvent` (filter + order) | ✅ |
| AC-2 | `POST /api/admin/payments/webhook-events/:eventId/retry` прави retry чрез `stripe.events.retrieve(eventId)` | ✅ |
| AC-3 | Retry не прави side effects ако event вече е processed (idempotent) | ✅ |
| AC-4 | Retry връща резултат (processed/failed + message) без да crash-ва | ✅ |

### 3.2 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | BE e2e: list failed events показва failure записан от webhook processing | ✅ |
| AC-6 | BE e2e: retry на failed event прави event processed и записва purchase ако е checkout success | ✅ |

---

## 4. Technical Notes

- Endpoint-ите са admin-only: `@UseGuards(JwtAuthGuard, AdminGuard)`.
- Списъкът е в `stripe_webhook_events` (вече имаме `event_payload`, `error_message`, `error_stack`).
- Retry използва Stripe API `events.retrieve` (не signature verification).
