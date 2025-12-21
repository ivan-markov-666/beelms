# EPIC-PAYMENTS-OPS: Payments Ops (Hardening & Reconciliation)

_BMAD Epic Spec | Status: 🟡 In Progress_

---

## 1. Goal

Да направим payments системата production-ready от операционна гледна точка:

- стабилно поведение при async payment методи (delayed / pending)
- реакция при refunds / disputes (revocation + audit)
- tooling за debugging/reconciliation (failed webhook events, retry)

---

## 2. Non-Goals

- Subscriptions / invoices
- Full accounting / tax / VAT
- Admin UI с пълна покупко-история и BI

---

## 3. Stories (MVP within this EPIC)

### STORY-PAYMENTS-5: Stripe async payment webhooks

- **Goal:** покриваме `checkout.session.async_payment_succeeded` и `checkout.session.async_payment_failed`.

### STORY-PAYMENTS-4: Refunds / disputes / chargebacks (access revocation)

- **Goal:** revoke на достъп и audit trail при refund/dispute.

### STORY-PAYMENTS-6: Reconciliation & retry tooling (MVP)

- **Goal:** admin-only endpoint-и за листинг на failed events + retry за safe event-и.

---

## 4. Key Design Decisions

- Stripe webhooks са source of truth за финалното purchase записване.
- Event-level idempotency чрез persisted `stripe_webhook_events`.
- При operational issues се разчита на observability (event payload + error stack) и tooling за retry.

---

## 5. Open Questions

- Кои Stripe events са canonical за refunds/disputes според избрания Checkout flow (session/charge/payment_intent)?
- Каква е политиката за revoke (immediate vs grace period) и има ли manual override?
- Нужен ли е UI, или първо BE endpoints + минимален admin tooling?
