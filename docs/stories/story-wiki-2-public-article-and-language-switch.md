# STORY-WIKI-2: Public Wiki article + language switch

_BMAD Story Spec | EPIC: EPIC-CORE-WIKI-CONTENT | Status: ✅ Implemented_

---

## 1. Goal

Доставяне на публичния detail екран за Wiki статия, достъпен без акаунт, с поддръжка на многоезични версии и URL структура `/wiki/[slug]?lang=...`.

- Когато статията съществува на няколко езика, потребителят може да превключва между тях.
- Показват се заглавие, съдържание (markdown → HTML), последна редакция, status badge (ако е allowed) и действия (Share / Print).

---

## 2. Non-Goals

- Admin редакторът (покрит от STORY-ADMIN-2 / STORY-WIKI-ADMIN-1 / STORY-WIKI-3)
- Wiki helpful feedback, related articles, metrics (WIKI-POST серии)
- Wiki SEO sitemap (post-MVP)

---

## 3. Acceptance Criteria

### 3.1 Public article loading

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/wiki/articles/:slug?lang=` връща статия само ако статусът е `active` и версията е публикувана | ✅ |
| AC-2 | Response съдържа `id`, `slug`, `visibility`, `tags`, `language`, `title`, `subtitle?`, `content`, `status`, `updatedAt` | ✅ |
| AC-3 | Ако е подаден `lang` и няма публикувана версия за него → `404` | ✅ |
| AC-4 | 404 се връща за липсващ slug, `inactive`, `draft` или `course_only` статии | ✅ |

### 3.2 Frontend rendering & UX

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Страницата `/wiki/[slug]` (Next.js App Router) е **Server Components + RSC fetch** за съдържанието, без client flicker | ✅ |
| AC-6 | Layout показва breadcrumb, заглавие, език selector (dropdown), последна редакция | ✅ |
| AC-7 | Markdown се рендерира с общия renderer (поддържа code blocks, lists, tables, tip callouts) | ✅ |
| AC-8 | Има бутони „Сподели“ (Web Share API + clipboard fallback) и „Принтирай“ (window.print) | ✅ |
| AC-9 | Language selector използва query param `lang`; превключването пренасочва към `/wiki/[slug]?lang=xx` и SSR зарежда избраната версия | ✅ |

### 3.3 SEO & caching

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Next.js `generateMetadata` / `head` задава dynamic title/description според статията | ✅ |
| AC-11 | API responses са cache-ируеми (public) | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- `be/src/wiki/wiki.controller.ts` → `getArticleBySlug`
- `be/src/wiki/wiki.service.ts` → `findArticleBySlug`, status enforcement + language version check
- DTOs: `WikiArticleResponseDto`
- Entities: `WikiArticleEntity` + `WikiArticleVersionEntity`
- Guards: none (public route)

### Frontend
- `fe/src/app/wiki/[slug]/page.tsx` → server component fetching article + related SSR data
- `fe/src/app/wiki/_components/wiki-article-meta.tsx` → article meta (language + last updated)
- `fe/src/app/wiki/_components/wiki-article-actions.tsx` → share/print actions
- `fe/src/app/wiki/_components/wiki-markdown.tsx` → markdown rendering
- `fe/src/app/wiki/_components/wiki-article-feedback.tsx` → helpful feedback UI
- `fe/src/app/wiki/_components/wiki-related-articles.tsx` → related articles section
- `fe/src/i18n/messages.ts` → keys `wiki.lastUpdated`, `wiki.shareAction`, `wiki.printAction`, `wiki.languageSwitch`

### Tests
- FE: `wiki-article-page.test.tsx` (RSC fetch order, `lang` propagation, 404 → notFound) ✅
- BE: `test/wiki-article.e2e-spec.ts` (bg/en versions, 404s incl. missing language version) ✅

---

## 5. Notes
- `course_only` статии са достъпни само през Course detail и не се показват публично – Story проверява flag.
- При подаден `lang` и липсваща езикова версия, се връща `404` (без silent fallback).
- Markdown renderer се използва и в admin preview.
