# STORY-SETTINGS-1: Instance Config (Branding + Public Settings Read)

_BMAD Story Spec | EPIC: EPIC-CORE-INSTANCE-SETTINGS | Status: ✅ Implemented_

---

## 1. Goal

Да има централизирана **Instance Config** концепция за beelms инстанция (single-tenant), която покрива:

- Branding/identity (appName, logoUrl, primaryColor – MVP може да е minimal)
- Публични настройки, които FE може да чете, за да скрива/показва функционалности (feature toggles)

Това е основа за:

- feature toggles (STORY-SETTINGS-2)
- admin settings UI
- legal content editor (STORY-SETTINGS-3)

---

## 2. Non-Goals

- Multi-tenant model (OrgID в таблици)
- Автоматично provision-ване на инфраструктура (Redis/RabbitMQ/Prometheus/Sentry)
- Пълен theming/white-label UI

---

## 3. Acceptance Criteria

### 3.1 Backend: Data model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има таблица/Entity `instance_config` (единичен ред) с branding + settings JSON | ✅ |
| AC-2 | Има migration за `instance_config` | ✅ |
| AC-3 | При празна база, `instance_config` се инициализира (seed или on-demand create) | ✅ |

### 3.2 Backend: Public API

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | `GET /api/public/settings` връща публични настройки (без чувствителни данни) | ✅ |
| AC-5 | Response съдържа: `branding` + `features` + `languages` | ✅ |
| AC-6 | Endpoint е cacheable (MVP: in-memory cache 30–60s или HTTP cache headers) | ✅ |

### 3.3 Frontend (minimal)

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | FE има helper `getPublicSettings()` и може да скрива меню/CTA за деактивирани модули | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Entity:
  - `be/src/settings/instance-config.entity.ts`
- Module:
  - `be/src/settings/settings.module.ts`
- Service:
  - `be/src/settings/settings.service.ts`
- Controller:
  - `be/src/settings/public-settings.controller.ts`
    - `GET /public/settings`
- Migration:
  - `be/src/migrations/*-InitInstanceConfig.ts`

**Suggested DTO:**

- `PublicSettingsDto`:
  - `branding: { appName: string; logoUrl?: string | null; primaryColor?: string | null }`
  - `features: { wikiPublic: boolean; courses: boolean; auth: boolean; paidCourses: boolean; gdprLegal: boolean; infraRedis: boolean; infraRabbitmq: boolean; infraMonitoring: boolean; infraErrorTracking: boolean }`
  - `languages: { supported: string[]; default: string }`

### 4.2 Frontend

- API helper:
  - `fe/src/app/_data/public-settings.ts` (или аналогичен слой)
- Consumption points (примерно):
  - header/nav (скрива “Courses” ако `features.courses=false`)
  - auth routes (ако `features.auth=false`, redirect към home + message)

---

## 5. Test Plan

### 5.1 Backend

- Unit: `SettingsService` създава default config ако липсва.
- E2E:
  - `GET /api/public/settings` → 200 и валиден shape.

### 5.2 Frontend

- Unit: helper fetch + fallback.

---

## 6. Notes

- Този story създава **authoritative** източник на truth за това кои модули са активни.
- Всички feature toggles в код трябва да четат от `SettingsService` + env override (ако е нужно за install-time defaults).

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Created story spec for instance config + public settings read |
