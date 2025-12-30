# STORY-PAYMENTS-4: Refunds / Disputes / Chargebacks (Access Revocation)

_BMAD Story Spec | EPIC: EPIC-PAYMENTS-OPS | Status: 🟢 Implemented_

---

## 1. Goal

Да поддържаме коректен paid access lifecycle при refund/dispute събития от Stripe:

- когато има refund или dispute, достъпът до paid курса се отнема (revoke)
- оставяме audit следа (кога/защо/кой event)
- обработката е идемпотентна и безопасна

---

## 2. Non-Goals

- UI за admin operations (отделна story)
- Автоматичен retry/reconciliation tooling (отделна story)
- Пълно покритие на всички Stripe dispute статуси (MVP coverage)

---

## 3. Acceptance Criteria

### 3.1 Data model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `course_purchases` има revoked полета (напр. `revoked_at`, `revoked_reason`, `revoked_event_id`) | ✅ |
| AC-2 | Access check за paid courses игнорира revoked purchases | ✅ |

### 3.2 Backend (Webhooks)

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | Обработваме `charge.refunded`: намираме purchase по `stripe_payment_intent_id` и маркираме revoke | ✅ |
| AC-4 | Обработваме поне 1 dispute event (MVP): `charge.dispute.created` → revoke purchase | ✅ |
| AC-5 | Webhook handler е idempotent на ниво `event.id` (второ processing няма side effects) | ✅ |
| AC-6 | При невъзможност да намерим purchase, event се записва като failed (за ops/debug), но webhook връща 200 | ✅ |

### 3.3 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | BE e2e: refund event → purchase става revoked и paid access се блокира | ✅ |
| AC-8 | BE e2e: dispute event → purchase става revoked | ✅ |

---

## 4. Technical Notes

- В момента access check е: Enrollment + (ако course.isPaid) наличие на purchase по `(userId, courseId)`.
- За revoke без data loss: маркираме purchase като revoked (вместо delete), и всички checks трябва да изискват `revoked_at IS NULL`.
- За mapping от Stripe refund/dispute към purchase: използваме `payment_intent` и търсим по `stripe_payment_intent_id`.

---

## 5. Test Plan

- Генерираме purchase чрез webhook success event.
- Симулираме `charge.refunded` event с `payment_intent` = purchase.stripePaymentIntentId.
- Очакваме purchase.revokedAt != null и последващ access check да fail-не.
