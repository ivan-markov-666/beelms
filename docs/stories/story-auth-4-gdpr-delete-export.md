# STORY-AUTH-4: GDPR Delete / Export

_BMAD Story Spec | EPIC: EPIC-CORE-AUTH-ACCOUNTS | Status: ✅ Implemented_

---

## 1. Goal

Да покрием базови GDPR user права за MVP:

- export на лични данни (authenticated request)
- изтриване/деактивиране на акаунт (authenticated request)

---

## 2. Non-Goals

- Асинхронен export job + download линк
- Реално изпращане на export файл по email
- Истинско физическо изтриване на всички записи от DB (MVP прави безопасна деактивация + анонимизация)
- Admin tooling за GDPR

---

## 3. Acceptance Criteria

### 3.1 Backend (Export)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `POST /api/users/me/export` (JWT) връща export payload за текущия user | ✅ |
| AC-2 | Export endpoint е rate-limited (per userId) | ✅ |
| AC-3 | Export може да изисква captcha чрез env flag (400 ако липсва) | ✅ |

### 3.2 Backend (Delete)

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | `DELETE /api/users/me` (JWT) деактивира акаунта (idempotent) | ✅ |
| AC-5 | След delete: protected endpoints връщат 401 за стария token | ✅ |
| AC-6 | След delete: login със старите credentials fail-ва | ✅ |
| AC-7 | Delete flow почиства чувствителни полета (verification/reset tokens, pending email) | ✅ |

### 3.3 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | `/profile` има section за Export с CTA и показва export payload | ✅ |
| AC-9 | `/profile` има section за Delete с two-step confirmation UI | ✅ |
| AC-10 | След delete: token се чисти и user се redirect-ва към `/auth/account-deleted` | ✅ |

### 3.4 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-11 | BE e2e тестове покриват export + delete flows | ✅ |
| AC-12 | FE unit тестове покриват export + delete actions в profile page | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Controller:
  - `be/src/auth/account.controller.ts`
    - `POST /users/me/export`
    - `DELETE /users/me`
- Service:
  - `be/src/auth/account.service.ts`
    - `exportData()` (записва timestamps + връща payload)
    - `deleteAccount()` (deactivate + anonymize + clear tokens)
- User fields:
  - `gdpr_erasure_requested_at`
  - `gdpr_erasure_completed_at`
  - `last_export_requested_at`
  - `last_export_delivered_at`

### 4.2 Frontend

- `fe/src/app/profile/page.tsx`
  - Export section
  - Delete section + two modal confirmations
- `fe/src/app/auth/account-deleted/page.tsx`

---

## 5. Test Plan

### 5.1 BE e2e

- `be/test/account.e2e-spec.ts`
  - export success + captcha requirement
  - delete success + token invalidation
  - re-register with same email after delete
  - INT-PA full happy path

### 5.2 FE unit

- `fe/src/app/auth/__tests__/profile-page.test.tsx`
  - export success path
  - delete two-step confirmation + redirect

---

## 6. Config / Env

- `ACCOUNT_EXPORT_REQUIRE_CAPTCHA`
- `DELETED_EMAIL_DOMAIN`

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented existing implementation as STORY-AUTH-4 |
