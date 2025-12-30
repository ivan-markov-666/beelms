# STORY-SETTINGS-2: Feature Toggles Admin (Modules + Infra + Languages)

_BMAD Story Spec | EPIC: EPIC-CORE-INSTANCE-SETTINGS | Status: ✅ Implemented_

---

## 1. Goal

Администраторът може да управлява **feature toggles** на инстанцията през Admin UI/API, както е описано в Product Brief:

- `FT-WIKI-PUBLIC-ON/OFF`
- `FT-COURSES-ON/OFF`
- `FT-AUTH-ON/OFF`
- `FT-PAID-COURSES-ON/OFF`
- `FT-GDPR-AND-LEGAL-ON/OFF`
- `FT-LANGUAGES-CONFIG` (списък езици + default)
- infra toggles:
  - `FT-INFRA-REDIS`
  - `FT-INFRA-RABBITMQ`
  - `FT-INFRA-MONITORING`
  - `FT-INFRA-ERROR-TRACKING`

---

## 2. Non-Goals

- Реално автоматично включване/изключване на Docker services (това е install-time/ops задача)
- Full permissions matrix за всеки toggle (MVP: admin-only)
- Audit log (може да се добави по-късно)

---

## 3. Acceptance Criteria

### 3.1 Backend: Admin Settings API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/settings` връща текущите settings (features + languages + branding) | ✅ |
| AC-2 | `PATCH /api/admin/settings` обновява settings (partial update) | ✅ |
| AC-3 | Само `admin` има достъп (JwtAuthGuard + AdminGuard) | ✅ |
| AC-4 | `languages.supported` има минимум 1 език; `languages.default` е в supported | ✅ |

### 3.2 Backend: Runtime enforcement

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Ако `features.auth=false`, auth endpoints (register/login/forgot/reset/verify) са disabled (връщат 404 или 403, консистентно) | ✅ |
| AC-6 | Ако `features.wikiPublic=false`, public wiki endpoints са disabled (list/article) | ✅ |
| AC-7 | Ако `features.courses=false`, публичният каталог + enroll + my courses са disabled | ✅ |
| AC-8 | Ако `features.paidCourses=false`, paid course unlock flow е disabled | ✅ |
| AC-9 | Ако `features.gdprLegal=false`, GDPR endpoints (export/delete) са disabled и FE скрива legal pages/navigation | ✅ |

### 3.3 Frontend: Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | `/admin/settings` страница показва toggle-и + languages config и позволява save | ✅ |
| AC-11 | UI има confirmation за risky toggles (напр. auth off) | ✅ |
| AC-12 | Public UI (navbar/footer) се адаптира спрямо `GET /api/public/settings` | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Reuse: `SettingsModule` / `SettingsService` / `InstanceConfig` от STORY-SETTINGS-1.
- Admin controller:
  - `be/src/settings/admin-settings.controller.ts`
    - `GET /admin/settings`
    - `PATCH /admin/settings`
- Enforcement options (MVP):
  - Option A: Guards/Interceptors per controller, checking `SettingsService.isEnabled('auth')` etc.
  - Option B: global middleware mapping paths → feature gates.

**Recommended MVP approach:** per-controller guards (least magic, easiest to test).

### 4.2 Frontend

- New page:
  - `fe/src/app/admin/settings/page.tsx`
- Shared data:
  - `getPublicSettings()` used by layout/nav/footer.

---

## 5. Test Plan

### 5.1 Backend

- E2E:
  - toggle `auth=false` → `/api/auth/login` returns expected error
  - toggle `wikiPublic=false` → `/api/wiki/articles` returns expected error

### 5.2 Frontend

- Unit: admin settings page renders defaults and calls PATCH.

---

## 6. Notes

- Settings трябва да поддържат **env override** за първоначални defaults при инсталация (например `INSTALL_DEFAULT_*`).
- Трябва да е ясно дефинирано дали disabled feature връща `404` (feature hidden) или `403` (feature forbidden). MVP препоръка: `404` за public endpoints.

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Created story spec for admin-managed feature toggles + languages config |
