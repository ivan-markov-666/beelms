# STORY-ADMIN-4: Admin Metrics Overview (MVP)

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Да предостави базово табло за администраторите с основни ключови метрики за платформата:
- общ брой регистрирани потребители;
- базови wiki метрики (брой статии + топ статии);
- агрегирани админ метрики за активност + wiki insights (views/feedback/attention);
- (post-MVP) advanced metrics секция (виж STORY-MTX-POST-1).

Фокусът е MVP – без сложни dashboards.

---

## 2. Non-Goals

- Разширени analytics (referrers, funnels)
- BI/Excel export
- Realtime dashboards

---

## 3. Acceptance Criteria

### 3.1 Metrics API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/metrics/overview` връща: `totalUsers`, `totalArticles`, `topArticles`, `usersChangePercentSinceLastMonth` | ✅ |
| AC-2 | `GET /api/admin/metrics/activity-summary?from=&to=` връща агрегати за user/wiki actions + trend | ✅ |
| AC-3 | `GET /api/admin/metrics/wiki-views?from=&to=&limit=` връща views + unique visitors + daily series | ✅ |
| AC-4 | `GET /api/admin/metrics/wiki-feedback?from=&to=&limit=` връща helpful feedback aggregates + daily series | ✅ |
| AC-5 | `GET /api/admin/metrics/wiki-attention?from=&to=&limit=` връща attention score (views + feedback) | ✅ |
| AC-6 | (post-MVP) `GET /api/admin/metrics/advanced?from=&to=&limit=` + `/advanced/export` са описани в STORY-MTX-POST-1 | ✅ |

### 3.2 Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | `/admin/metrics` страница показва overview (users + wiki) и секции за activity summary + wiki insights | ✅ |
| AC-7 | Cards имат i18n labels и responsive grid layout | ✅ |
| AC-8 | Wiki views/feedback/attention секциите визуализират топ листи и daily трендове за избрания период | ✅ |
| AC-9 | Loading/error states са покрити (skeletons + retry) | ✅ |

### 3.3 Security

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Endpoint изисква JWT + admin | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- Controller: `be/src/auth/admin-metrics.controller.ts`
- Service: `be/src/auth/admin-metrics.service.ts`
- Data sources:
  - `users` → `User` repository (counts + change %)
  - `wiki` → `WikiArticle`, `WikiArticleView`, `WikiArticleIpViewDaily`, `WikiArticleFeedback`
  - `advanced` (post-MVP) → `AnalyticsSession`, `AnalyticsPageViewDaily` (виж STORY-MTX-POST-1)

### Frontend
- Page: `fe/src/app/admin/metrics/page.tsx`
- (Self-contained) fetch към `GET /admin/metrics/*` + `GET /admin/users/stats` + `GET /admin/wiki/articles`

### Tests
- BE unit: `admin-metrics.service.spec.ts`
- FE unit: `admin-metrics-page.test.tsx`

---

## 5. Notes
- Wiki views разчита на STORY-WIKI-POST-3 таблицата `wiki_article_views`.
- Activity логът помага за basic auditing и troubleshooting.
