# STORY-AUTH-2: Forgot / Reset Password

_BMAD Story Spec | EPIC: EPIC-CORE-AUTH-ACCOUNTS | Status: ✅ Implemented_

---

## 1. Goal

Да поддържаме стандартен password recovery flow:

- потребителят може да поиска reset линк (forgot password)
- потребителят може да смени паролата си с валиден reset token
- flow-ът е безопасен (не издава дали email съществува)

---

## 2. Non-Goals

- Реално изпращане на email-и (за MVP логваме reset link в non-prod/non-test)
- MFA / OTP
- Password strength policy извън min length
- UI за "check your email" с реална inbox интеграция

---

## 3. Acceptance Criteria

### 3.1 Backend (Endpoints)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `POST /api/auth/forgot-password` винаги връща `200`, независимо дали email съществува | ✅ |
| AC-2 | При валиден email генерираме reset token и TTL (на потребителя) | ✅ |
| AC-3 | `POST /api/auth/reset-password` сменя паролата при валиден token | ✅ |
| AC-4 | При invalid/expired token `reset-password` връща `400` | ✅ |
| AC-5 | След успешен reset token-ът се clear-ва (one-time use) | ✅ |

### 3.2 Security / Abuse protection (MVP)

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | `forgot-password` е rate-limited (per IP) | ✅ |
| AC-7 | `reset-password` е rate-limited (per IP) | ✅ |
| AC-8 | (Optional) captcha token може да се изисква за `forgot-password` чрез env flag | ✅ |

### 3.3 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | `/auth/forgot-password` форма за email + success state | ✅ |
| AC-10 | `/auth/reset-password?token=...` форма за new password + confirm + success redirect към login | ✅ |
| AC-11 | UI показва user-friendly грешки за invalid token и CTA към forgot page | ✅ |

### 3.4 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-12 | BE e2e тест покрива forgot/reset flow | ✅ |
| AC-13 | FE unit тестове покриват forgot/reset pages | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Controller:
  - `be/src/auth/auth.controller.ts`
    - `POST /auth/forgot-password` (`@HttpCode(200)`)
    - `POST /auth/reset-password` (`@HttpCode(200)`)
- Service:
  - `be/src/auth/auth.service.ts`
    - `forgotPassword()`
    - `resetPassword()`
- DTOs:
  - `be/src/auth/dto/forgot-password.dto.ts`
  - `be/src/auth/dto/reset-password.dto.ts`
- User fields:
  - `reset_password_token`
  - `reset_password_token_expires_at`

### 4.2 Frontend

- Forgot password page:
  - `fe/src/app/auth/forgot-password/page.tsx`
  - `fe/src/app/auth/forgot-password/_components/forgot-password-content.tsx`
- Reset password page:
  - `fe/src/app/auth/reset-password/page.tsx`
  - `fe/src/app/auth/reset-password/_components/reset-password-content.tsx`

---

## 5. Test Plan

### 5.1 BE e2e

- `be/test/auth.e2e-spec.ts`
  - `POST /api/auth/forgot-password` → 200
  - `POST /api/auth/reset-password` с валиден token → 200
  - login със стара парола → 401
  - login с нова парола → 200
  - повторен reset със същия token → 400

### 5.2 FE unit

- `fe/src/app/auth/__tests__/forgot-password-page.test.tsx`
- `fe/src/app/auth/__tests__/reset-password-page.test.tsx`

---

## 6. Config / Env

- `AUTH_REQUIRE_CAPTCHA` (ако е `true`, `captchaToken` е required за forgot-password)

---

## 7. Notes

- Reset link-ът се логва само когато `NODE_ENV` не е `production` и не е `test`.
- Това е достатъчно за MVP/dev, но за production следваща стъпка е реален email provider (SendGrid/Mailgun/etc.).

---

## 8. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented existing implementation as STORY-AUTH-2 |
