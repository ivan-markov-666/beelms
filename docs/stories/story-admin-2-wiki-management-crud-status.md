# STORY-ADMIN-2: Admin Wiki management (CRUD + status workflow)

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Да предостави на редакторите Admin UI/API за пълен контрол върху Wiki статиите: създаване, редакция, статуси (`draft`/`active`/`inactive`/`course_only`), многоезични версии и preview.

---

## 2. Non-Goals

- Version history / rollback (STORY-ADMIN-3)
- Public rendering (STORY-WIKI-2)
- Article feedback/related/metrics (WIKI-POST series)

---

## 3. Acceptance Criteria

### 3.1 Admin API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/wiki?page=&search=&status=` връща пагиниран списък + basic filters | ✅ |
| AC-2 | `GET /api/admin/wiki/:slug` връща детайл на статия + всички езикови версии + metadata (tags, heroImage, status) | ✅ |
| AC-3 | `POST /api/admin/wiki` създава статия (slug, default language version, status, tags) | ✅ |
| AC-4 | `PATCH /api/admin/wiki/:slug` обновява статията (tags, status, heroImage, courseOnly flag) | ✅ |
| AC-5 | `POST /api/admin/wiki/:slug/versions` създава/редактира конкретна езикова версия (`language`, `title`, `content`, `seoDescription`, `isPublished`) | ✅ |
| AC-6 | API валидира уникалност на slug и поддържа safe-slug generator | ✅ |
| AC-7 | `course_only` flag ограничава `active` статии да бъдат достъпни само през курсове (не в публичен лист) | ✅ |

### 3.2 Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Admin Wiki list показва филтри + status badge + езикови индикатори | ✅ |
| AC-9 | Edit страница позволява CRUD върху езиковите версии (tabs), включително preview | ✅ |
| AC-10 | Има “Save draft”, “Publish”, “Unpublish” действия по език + глобален статус switch | ✅ |
| AC-11 | Tags field (comma-separated) с validation + helper текст | ✅ |
| AC-12 | Hero image uploader (optional) + alt text | ✅ |

### 3.3 Security

| # | Criterion | Status |
|---|-----------|--------|
| AC-13 | Admin Wiki endpoints изискват JWT + admin | ✅ |
| AC-14 | Audit log записва create/update/publish действия | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- Controller: `be/src/wiki/admin-wiki.controller.ts`
- Service: `be/src/wiki/wiki.service.ts` (admin methods)
- DTOs: `AdminCreateWikiArticleDto`, `AdminUpdateWikiArticleDto`, `AdminCreateWikiVersionDto`
- Entities: `WikiArticle`, `WikiArticleVersion`
- Guards: `JwtAuthGuard`, `AdminGuard`

### Frontend
- Pages: `fe/src/app/admin/wiki/page.tsx`, `fe/src/app/admin/wiki/[slug]/edit/page.tsx`, `fe/src/app/admin/wiki/create/page.tsx`
- Components: `WikiVersionEditor`, `StatusBadge`, `TagsInput`
- API hooks: `useAdminWiki`, `adminWikiApi`

### Tests
- BE e2e: `be/test/admin-wiki.e2e-spec.ts`
- FE unit: `wiki-version-editor.test.tsx`

---

## 5. Notes
- Slug остава immutable след създаване (ако трябва промяна → нова статия + redirect post-MVP).
- Admin UI използва optimistic updates със `useTransition` и `toast` нотификации.
- Course-only статии са скрити от публичния лист, но остават достъпни за curriculum items.
