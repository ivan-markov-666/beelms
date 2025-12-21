# STORY-WIKI-3: Admin Statuses (Draft / Active / Inactive)

_BMAD Story Spec | EPIC: EPIC-CORE-WIKI-CONTENT | Status: ✅ Implemented_

---

## 1. Goal

Да имаме контролируем lifecycle на Wiki статията чрез статуси:

- `draft` — видима за админите, но не е публично достъпна
- `active` — публично достъпна (за `visibility=public`)
- `inactive` — скрита публично; може да остане в admin за исторически/архивни нужди

Целта е:

- публичната wiki да показва само `active` + `public` статии
- админите да могат лесно да активират/деактивират статии
- draft workflow да е възможен (вкл. draft autosave)

---

## 2. Non-Goals

- Пер-език publish статус като отделен workflow (в момента се ползва `isPublished` на version)
- Approval workflow (review/approval роли)
- Scheduling (publish at / unpublish at)

---

## 3. Acceptance Criteria

### 3.1 Data Model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `wiki_articles.status` поддържа `draft/active/inactive` | ✅ |
| AC-2 | `admin` DTO валидира допустимите стойности | ✅ |

### 3.2 Public Wiki правила

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | Public list endpoint връща само `status=active` и `visibility=public` | ✅ |
| AC-4 | Public article endpoint връща 404 за `inactive` или `draft` статии | ✅ |

### 3.3 Admin управление на статус

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Admin може да смени статуса през edit flow (`PUT /admin/wiki/articles/:id` с `status`) | ✅ |
| AC-6 | Admin може да смени статуса през quick action (`PATCH /admin/wiki/articles/:id/status`) | ✅ |
| AC-7 | Admin list UI показва статус badge и позволява filter по статус | ✅ |
| AC-8 | Admin list UI има toggle Active ↔ Inactive (draft не се toggle-ва от list) | ✅ |

### 3.4 Draft workflow

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | Draft autosave endpoint работи само ако статията е `draft` | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Entities / DB:
  - `be/src/wiki/wiki-article.entity.ts` (`status`, `visibility`, `tags`)
  - Migration: `be/src/migrations/1732542000000-InitWikiSchema.ts` (добавя `status`)
  - Migration: `be/src/migrations/1765932000000-AddVisibilityAndTagsToWikiArticles.ts`

- Public endpoints:
  - `be/src/wiki/wiki.controller.ts`
    - `GET /api/wiki/articles` → `wikiService.getActiveArticlesList(...)`
    - `GET /api/wiki/articles/:slug` → `wikiService.getArticleBySlug(...)`
  - `be/src/wiki/wiki.service.ts`
    - public queries филтрират по `where: { status: 'active', visibility: 'public' }`

- Admin endpoints:
  - `be/src/wiki/admin-wiki.controller.ts`
    - `PUT /api/admin/wiki/articles/:id` (body включва `status`)
    - `PATCH /api/admin/wiki/articles/:id/status` → `adminUpdateArticleStatus()` (204)
    - `POST /api/admin/wiki/articles` (create default status, FE праща `draft`)
    - `PATCH /api/admin/wiki/articles/:id/draft-autosave` (валидно само за `draft`)
  - DTO:
    - `be/src/wiki/dto/admin-update-wiki-status.dto.ts` → `@IsIn(['draft','active','inactive'])`

### 4.2 Frontend

- Admin list page:
  - `fe/src/app/admin/wiki/page.tsx`
    - status badges за `draft/active/inactive`
    - filter по статус
    - quick toggle Active ↔ Inactive чрез `PATCH /admin/wiki/articles/:id/status`

- Admin create page:
  - `fe/src/app/admin/wiki/create/page.tsx` (създава статия със `status: 'draft'`)

- Admin edit page:
  - `fe/src/app/admin/wiki/[slug]/edit/page.tsx`
    - select за `draft/active/inactive`

---

## 5. Test Plan

### 5.1 BE e2e

- Public:
  - `be/test/wiki-list.e2e-spec.ts` (list връща seed-нати активни статии)
  - `be/test/wiki-article.e2e-spec.ts` (article връща `status: 'active'`)
  - `be/test/wiki-visibility.e2e-spec.ts` (visibility gate за course_only)

- Admin:
  - `be/test/admin-wiki-list.e2e-spec.ts` (401 без token, 403 за non-admin, 200 за admin)
  - `be/test/admin-wiki-edit.e2e-spec.ts` (PUT update с `status`)

### 5.2 FE unit

- `fe/src/app/admin/wiki/__tests__/admin-wiki-page.test.tsx` (renders table / empty / error / missing token)

---

## 6. API Reference

### PATCH /api/admin/wiki/articles/:id/status

**Auth:** Required (JWT + Admin)

**Body:**
```json
{ "status": "inactive" }
```

**Response:**
- `204 No Content` — успех
- `400 Bad Request` — невалиден статус
- `401 Unauthorized` — без token
- `403 Forbidden` — non-admin
- `404 Not Found` — статията не съществува

---

## 7. Notes

- Публичните endpoints филтрират по `status='active'` и `visibility='public'`.
- За изтриване на статия backend изисква тя да НЕ е `active` (първо се set-ва `inactive`).

---

## 8. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented existing status management implementation as STORY-WIKI-3 |
