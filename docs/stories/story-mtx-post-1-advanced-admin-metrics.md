# MTX-POST-1: Advanced admin metrics dashboard (privacy-friendly)

_BMAD Story Spec | EPIC: POST-MVP-METRICS | Status: ✅ Implemented_

---

## 1. Цел

Да се имплементира **advanced admin metrics dashboard**, който показва:

- sessions (общо)
- avg session duration
- traffic source breakdown
- top pages
- daily trends (sessions + page views)
- export (CSV)

Решението е **privacy-friendly** и работи **само след opt-in consent**.

---

## 2. Non-goals

- User-level / per-user analytics
- Съхранение на IP адреси, user-agent, имейл или други PII в analytics таблиците
- Външни analytics интеграции (GA/Hotjar и др.)
- Real-time dashboards

---

## 3. Acceptance Criteria

### 3.1 Consent + tracking (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Показва се opt-in analytics consent banner (Accept/Decline), който се запазва локално | ✅ |
| AC-2 | При Decline не се праща analytics tracking към backend | ✅ |
| AC-3 | При Accept tracker праща best-effort `POST /api/analytics/track` при page navigation | ✅ |

### 3.2 Data model (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | Има таблица за сесии (session start/end, duration, initial path, source) | ✅ |
| AC-5 | Има таблица за дневно агрегирани page views по (date, path, source) | ✅ |
| AC-6 | Има миграция + индекси (вкл. unique за daily page views) | ✅ |

### 3.3 Public tracking endpoint (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | Има публичен endpoint `POST /api/analytics/track` (best-effort) | ✅ |
| AC-8 | Endpoint е rate-limited | ✅ |
| AC-9 | Tracking не блокира UI и не трябва да чупи страниците при грешки | ✅ |

### 3.4 Retention

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Retention policy: изтриване на analytics записи по-стари от **180 дни** (best-effort) | ✅ |

### 3.5 Admin API (advanced)

| # | Criterion | Status |
|---|-----------|--------|
| AC-11 | `GET /api/admin/metrics/advanced?from=&to=` връща sessions/duration/sources/top pages/daily series | ✅ |
| AC-12 | `GET /api/admin/metrics/advanced/export?from=&to=` връща CSV export | ✅ |

### 3.6 Admin UI (advanced)

| # | Criterion | Status |
|---|-----------|--------|
| AC-13 | Admin `/admin/metrics` показва advanced секция с cards/tables/daily trends | ✅ |
| AC-14 | Има Export CSV бутон | ✅ |
| AC-15 | Има i18n ключове за BG/EN/DE (labels/errors/buttons) | ✅ |

---

## 4. Имплементация (къде е в кода)

### Backend

- Entities:
  - `be/src/analytics/analytics-session.entity.ts`
  - `be/src/analytics/analytics-page-view-daily.entity.ts`
- Migration:
  - `be/src/migrations/1767100000000-AddAnalyticsTables.ts`
- Public tracking:
  - Controller: `be/src/analytics/analytics.controller.ts` (`POST /analytics/track`)
  - Service: `be/src/analytics/analytics.service.ts` (session window + daily aggregation + retention)
- Admin metrics:
  - Service: `be/src/auth/admin-metrics.service.ts` (`getAdvancedAnalytics`, `getAdvancedAnalyticsCsv`)
  - Controller: `be/src/auth/admin-metrics.controller.ts` (`GET /admin/metrics/advanced`, `/export`)

### Frontend

- Consent banner:
  - `fe/src/app/_components/analytics-consent-banner.tsx`
- Tracker:
  - `fe/src/app/_components/analytics-tracker.tsx`
- App mounting:
  - `fe/src/app/layout.tsx`
- Admin advanced metrics UI:
  - `fe/src/app/admin/metrics/page.tsx`
- i18n:
  - `fe/src/i18n/messages.ts`

---

## 5. Бележки (Privacy/GDPR)

- Analytics tracking е **opt-in**: без изрично съгласие не се изпращат събития.
- В analytics таблиците се пазят **само минимални технически/агрегирани данни** за usage метрики.
- Retention-ът е best-effort (не блокира заявки и не влияе на availability).

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Реализирано MTX-POST-1: consent + tracking + advanced admin metrics + export |
