# STORY-WIKI-1: Public list + search + language filter

_BMAD Story Spec | EPIC: EPIC-CORE-WIKI-CONTENT | Status: ✅ Implemented_

---

## 1. Goal

Публична Wiki страница, достъпна без акаунт, която показва списък от публикувани статии и позволява:

- търсене по заглавие/ключова дума
- филтриране по език
- pagination (MVP)

---

## 2. Non-Goals

- Admin редактор (отделни Admin stories)
- Related articles / helpful feedback / view metrics (post-MVP идеи, ако са извън scope)
- SEO sitemap за wiki (post-MVP)

---

## 3. Acceptance Criteria

### 3.1 Backend: Public list endpoint

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/wiki/articles` връща само `active` + `visibility=public` статии | ✅ |
| AC-2 | Поддържа query `q` (search) | ✅ |
| AC-3 | Поддържа query `lang` (филтрира по language версия) | ✅ |
| AC-4 | Поддържа pagination чрез `page` и `pageSize` | ✅ |
| AC-5 | Response включва `id`, `slug`, `title`, `language`, `updatedAt` | ✅ |

### 3.2 Frontend: Public list page

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | `/wiki` показва списък със статии и линк към `/wiki/[slug]?lang=...` | ✅ |
| AC-7 | Има search input + language dropdown (submit като GET form) | ✅ |
| AC-8 | Има empty state за “няма статии” и “няма резултати по филтри” | ✅ |
| AC-9 | Има pagination (Prev/Next + page links) | ✅ |

### 3.3 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | BE e2e тест: list връща активни публични статии + lang filter | ✅ |
| AC-11 | FE unit тест: wiki list render + filters + pagination | ✅ |

---

## 4. Technical Implementation (Where)

### Backend

- Controller: `be/src/wiki/wiki.controller.ts` → list endpoint
- Service: `be/src/wiki/wiki.service.ts` → `listPublicArticles()`

### Frontend

- Page: `fe/src/app/wiki/page.tsx`

---

## 5. Notes

- `lang` филтърът е “филтър по налична версия/език”, не променя UI езика.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Added missing story spec for public wiki list to match canonical backlog |
