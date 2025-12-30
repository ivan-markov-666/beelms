# STORY-WIKI-POST-3: Wiki view metrics (privacy-friendly)

_BMAD Story Spec | EPIC: EPIC-POST-MVP-WIKI | Status: ✅ Implemented_

---

## 1. Цел

Да се събират и показват метрики за гледаемост на Wiki статии, по начин съвместим с GDPR и добри практики за поверителност.

Фокус: **агрегирани дневни гледания**, без съхранение на IP/UA/идентификатори.

---

## 2. Non-goals

- Персонализирана аналитика (по потребител)
- Съхранение на referrer/UTM/сесии
- Външна analytics интеграция

---

## 3. Acceptance Criteria

### 3.1 Data model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Нова таблица `wiki_article_views` агрегира гледания по `(article_id, language, view_date)` | ✅ |
| AC-2 | Има миграция + индекси (вкл. unique) | ✅ |

### 3.2 Tracking (privacy-friendly)

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | При публично зареждане на Wiki article detail се инкрементира дневният брояч (best-effort; не чупи рендера) | ✅ |
| AC-4 | Не се съхраняват IP/UA/PII (само агрегати) | ✅ |
| AC-5 | Retention: изтриване на записи по-стари от 180 дни (best-effort, веднъж на ден) | ✅ |

### 3.3 Admin metrics

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | Нов endpoint `GET /admin/metrics/wiki-views?from=&to=&limit=` връща `{ totalViews, topArticles, daily }` | ✅ |
| AC-7 | Admin UI показва секция “Wiki views” (total + top + daily bars) | ✅ |
| AC-8 | Добавени са i18n ключове за BG/EN/DE | ✅ |

### 3.4 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | Unit тестовете са обновени за новите DI зависимости (WikiService + AdminMetricsService) | ✅ |

---

## 4. Имплементация (къде е в кода)

### Backend

- Entity: `be/src/wiki/wiki-article-view.entity.ts`
- Migration: `be/src/migrations/1767002000000-AddWikiArticleViews.ts`
- Tracking: `WikiService.getArticleBySlug()` → `recordArticleView()` (агрегат + retention)
- Admin metrics:
  - Service: `be/src/auth/admin-metrics.service.ts` (`getWikiViews`)
  - Controller: `be/src/auth/admin-metrics.controller.ts` (`GET wiki-views`)

### Frontend (Admin)

- UI: `fe/src/app/admin/metrics/page.tsx` (fetch `/admin/metrics/wiki-views` и визуализация)
- i18n: `fe/src/i18n/messages.ts` (common.* ключове за секцията)

---

## 5. Бележки (Privacy/GDPR)

- Събираме **само агрегирани дневни броячи**, което минимизира риска от лични данни.
- Retention-ът е best-effort (не блокира заявки).

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Реализирано STORY-WIKI-POST-3: агрегирани дневни гледания + admin метрики + UI |
