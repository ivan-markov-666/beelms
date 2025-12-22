# STORY-LEGAL-2: Terms/Privacy Acceptance in Register Flow

_BMAD Story Spec | EPIC: EPIC-CORE-CROSS-GDPR-LEGAL | Status: ✅ Implemented_

---

## 1. Goal

При регистрация потребителят трябва изрично да потвърди, че приема:

- Terms of Service
- Privacy Policy (Privacy/GDPR)

Целта е да има минимален „consent gate“ за MVP и да можем да докажем, че регистрацията е направена след изрично приемане.

---

## 2. Non-Goals

- Подписване с eIDAS / advanced signature
- Versioning на legal документи (termsVersion/privacyVersion)
- Granular consent management (маркетинг email opt-in/opt-out и т.н.)
- GDPR DPA/processor agreements

---

## 3. Acceptance Criteria

### 3.1 Frontend: Consent Gate on Register Form

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Register form има checkbox за приемане на Terms + Privacy | ✅ |
| AC-2 | Ако checkbox не е маркиран, UI показва валидационна грешка и не вика API | ✅ |
| AC-3 | Checkbox текстът съдържа CTA към `/legal/terms` и `/legal/privacy` | ✅ |

### 3.2 Public Legal Pages (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | `/legal/terms` страница е налична | ✅ |
| AC-5 | `/legal/privacy` страница е налична | ✅ |

### 3.3 Backend: Persisted Consent (Recommended for MVP)

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | `POST /api/auth/register` изисква consent флаг (напр. `acceptTerms: true`) | ✅ |
| AC-7 | При липсващ/false consent API връща `400` | ✅ |
| AC-8 | При успешна регистрация consent се записва в DB (напр. `termsAcceptedAt`, `privacyAcceptedAt` или общо поле) | ✅ |

---

## 4. Current Implementation Notes

### 4.1 What exists today (Implemented)

- FE register form има state `acceptTerms` и frontend validation.
- Има links към legal страниците.
- Има unit тест, който проверява, че без маркиране на checkbox не се прави submit.
- `/legal/terms` и `/legal/privacy` страници са имплементирани като публични pages.

- BE register изисква `acceptTerms: true` и при `false` връща `400`.
- BE записва `termsAcceptedAt` / `privacyAcceptedAt` при регистрация.
- Има BE e2e тестове за register + consent.

### 4.2 What was missing originally

- Persistence и enforcement в backend (вече реализирани).

---

## 5. Technical Implementation (Where)

### 5.1 Frontend

- Register form:
  - `fe/src/app/auth/register/_components/register-content.tsx`
    - `acceptTerms` state
    - validation error `registerErrorTermsRequired`
    - navigation buttons към `/legal/terms` и `/legal/privacy`
- Legal pages:
  - `fe/src/app/legal/terms/page.tsx`
  - `fe/src/app/legal/privacy/page.tsx`
- Tests:
  - `fe/src/app/auth/__tests__/register-page.test.tsx`

### 5.2 Backend (Current)

- Register DTO:
  - `be/src/auth/dto/register.dto.ts` (`acceptTerms`)
- Register implementation:
  - `be/src/auth/auth.service.ts` → `register()` (reject ако `acceptTerms !== true`, записва timestamp-и)
  - `be/src/auth/user.entity.ts` (`termsAcceptedAt`, `privacyAcceptedAt`)
  - Migration: `be/src/migrations/1765943000000-AddLegalAcceptanceToUser.ts`
  - Tests: `be/test/auth.e2e-spec.ts`

---

## 6. Notes

- Story е затворено: consent се валидира и персистира в BE, и има e2e покритие.

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented current FE-only consent gate and identified missing BE persistence |
| 2025-12-22 | Cascade | Updated spec to reflect implemented BE consent enforcement + persistence |
