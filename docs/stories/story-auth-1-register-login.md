# STORY-AUTH-1: Register / Login (JWT)

_BMAD Story Spec | EPIC: EPIC-CORE-AUTH-ACCOUNTS | Status: ✅ Implemented_

---

## 1. Goal

Да имаме базов auth скелет за приложението:

- регистрация на потребител (email + password)
- login (email + password) → JWT access token
- BE endpoints + FE UI за login/register

---

## 2. Non-Goals

- Forgot/Reset password (отделна story)
- Email verification UX (отделна story)
- Profile / change email/password / GDPR export/delete (отделни story-та)
- Social login
- Refresh tokens (MVP използва access token)

---

## 3. Acceptance Criteria

### 3.1 Backend

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `POST /api/auth/register` създава нов потребител с `email` + `password` (hash) | ✅ |
| AC-2 | Duplicate email връща `409` | ✅ |
| AC-3 | Невалидни данни (email format, password min length) връщат `400` | ✅ |
| AC-4 | `POST /api/auth/login` връща `accessToken` + `tokenType=Bearer` при валидни credentials | ✅ |
| AC-5 | Невалидни credentials връщат `401` | ✅ |
| AC-6 | JWT guard валидира Bearer token и отказва невалидни/expired токени | ✅ |

### 3.2 Security / Abuse protection (MVP)

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | Rate limit на register/login endpoints (IP / IP+email) | ✅ |
| AC-8 | (Optional) captcha token може да се изисква чрез env flag | ✅ |

### 3.3 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | Има `/auth/register` форма (email/password/confirm + Terms checkbox) | ✅ |
| AC-10 | Има `/auth/login` форма + записване на access token в localStorage | ✅ |
| AC-11 | Login UI валидира basic input и показва user-friendly грешки | ✅ |

### 3.4 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-12 | BE e2e тестове покриват register/login happy path + edge cases | ✅ |
| AC-13 | FE unit тестове покриват login/register pages | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Controller:
  - `be/src/auth/auth.controller.ts`
    - `POST /auth/register`
    - `POST /auth/login`
- Service:
  - `be/src/auth/auth.service.ts`
- DTOs:
  - `be/src/auth/dto/register.dto.ts`
  - `be/src/auth/dto/login.dto.ts`
  - `be/src/auth/dto/auth-token.dto.ts`
- JWT:
  - `be/src/auth/jwt-auth.guard.ts`
  - `be/src/auth/auth.module.ts` (JwtModule)

### 4.2 Frontend

- Auth token storage:
  - `fe/src/app/auth-token.ts`
- Login page:
  - `fe/src/app/auth/login/page.tsx`
  - `fe/src/app/auth/login/_components/login-content.tsx`
- Register page:
  - `fe/src/app/auth/register/page.tsx`
  - `fe/src/app/auth/register/_components/register-content.tsx`

---

## 5. Test Plan

### 5.1 BE e2e

- `be/test/auth.e2e-spec.ts`
  - register success
  - register duplicate → 409
  - register invalid data → 400
  - login success → token
  - login invalid credentials → 401

### 5.2 FE unit

- `fe/src/app/auth/__tests__/login-page.test.tsx`
- `fe/src/app/auth/__tests__/register-page.test.tsx`

---

## 6. Config / Env

- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default `900s`)
- `AUTH_REQUIRE_CAPTCHA` (ако е `true`, `captchaToken` е required)

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented existing implementation as STORY-AUTH-1 |
