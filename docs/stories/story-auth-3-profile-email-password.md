# STORY-AUTH-3: Profile + Change Email/Password

_BMAD Story Spec | EPIC: EPIC-CORE-AUTH-ACCOUNTS | Status: ✅ Implemented_

---

## 1. Goal

Да дадем на логнат потребител базов профилен екран (MVP) с:

- преглед на текущ профил (email, дата на регистрация)
- заявка за смяна на email (с потвърждение чрез verification token)
- смяна на парола (валидиране на текуща парола)

---

## 2. Non-Goals

- Пълна email delivery система (за MVP verification линковете се логват в non-prod/non-test)
- UI за "email inbox" / resend verification (извън minimal UX)
- Password strength rules извън min length
- Сесии/refresh tokens (ползваме access token)

---

## 3. Acceptance Criteria

### 3.1 Backend

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/users/me` (JWT) връща user profile | ✅ |
| AC-2 | `PATCH /api/users/me` (JWT) позволява заявка за смяна на email (pending email + verification token) | ✅ |
| AC-3 | След verification (`POST /api/auth/verify-email`) email се сменя | ✅ |
| AC-4 | `PATCH /api/users/me` връща `409` ако email е зает | ✅ |
| AC-5 | `PATCH /api/users/me` връща `429` при лимит за email verification промени | ✅ |
| AC-6 | `POST /api/users/me/change-password` (JWT) сменя парола при валидна текуща парола | ✅ |
| AC-7 | След смяна на парола, старите access tokens стават невалидни (`tokenVersion` bump) | ✅ |

### 3.2 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | `/profile` изисква token; при липса redirect към `/auth/login` | ✅ |
| AC-9 | Потребителят може да поиска смяна на email и получава info message за потвърждение | ✅ |
| AC-10 | UI има basic throttling за повторна заявка за същия email (60s) | ✅ |
| AC-11 | Потребителят може да смени парола (current + new + confirm) и получава success message | ✅ |
| AC-12 | Logout изчиства token-а и redirect-ва към home | ✅ |

### 3.3 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-13 | BE e2e тестове: get profile, request email change + verify, change password, token revocation | ✅ |
| AC-14 | FE unit тестове: profile page (email change edge cases, change password, logout) | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Account controller:
  - `be/src/auth/account.controller.ts`
    - `GET /users/me`
    - `PATCH /users/me`
    - `POST /users/me/change-password`
- Account service:
  - `be/src/auth/account.service.ts`
    - `getCurrentProfile()`
    - `updateEmail()` (pending email + token)
    - `changePassword()` (bcrypt compare + tokenVersion++)
- Email verification:
  - `be/src/auth/auth.controller.ts` → `POST /auth/verify-email`
  - `be/src/auth/auth.service.ts` → `verifyEmail()`

### 4.2 Frontend

- Profile page:
  - `fe/src/app/profile/page.tsx`
- Token storage:
  - `fe/src/app/auth-token.ts`

---

## 5. Test Plan

### 5.1 BE e2e

- `be/test/account.e2e-spec.ts`
  - getMe (200/401)
  - update email → pending + verify-email → email changes
  - change password + old token revoked

### 5.2 FE unit

- `fe/src/app/auth/__tests__/profile-page.test.tsx`

---

## 6. Notes

- Смяната на email е two-step: `PATCH /users/me` само подготвя pending state, а истинската смяна става след `POST /auth/verify-email`.
- Има 24h лимит за броя успешни email change verifications (отразява се и в profile DTO).

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented existing implementation as STORY-AUTH-3 |
