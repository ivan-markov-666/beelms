# STORY-WIKI-POST-1: Wiki article helpful feedback (Post-MVP)

_BMAD Story Spec | EPIC: EPIC-POST-MVP-WIKI | Status: ✅ Implemented_

---

## 1. Goal

Enable privacy-friendly "Was this article helpful?" voting on public wiki articles so that PMs can track usefulness trends and users can quickly share lightweight feedback.

---

## 2. Non-Goals

- Admin UI for moderating individual votes
- Detailed user sentiment analytics dashboards (covered by future MTX stories)
- Per-language/per-version variance tracking

---

## 3. Acceptance Criteria

### 3.1 Data model & persistence

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | New `wiki_article_feedback` table + migration with article/user foreign keys, guest support, unique constraint for `(article_id,user_id)` | ✅ |

### 3.2 API & service logic

| # | Criterion | Status |
|---|-----------|--------|
| AC-2 | Public POST `/api/wiki/articles/:slug/feedback` with optional JWT guard; logged-in votes are upserted, guests create anonymous rows | ✅ |
| AC-3 | Public GET `/api/wiki/articles/:slug/feedback/summary` returning `{ helpfulYes, helpfulNo, total }` respecting article visibility/status | ✅ |

### 3.3 Frontend experience

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | Wiki article page renders a “Was this article helpful?” block (BG/EN/DE i18n) with Yes/No buttons, optimistic acknowledgement, and live summary refresh | ✅ |
| AC-5 | FE pulls initial summary server-side to avoid client flicker and gracefully handles API errors | ✅ |

### 3.4 Tests & quality gates

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | BE e2e covers guest vote, authenticated upsert, summary retrieval, and 404 for unknown slugs (`be/test/wiki-feedback.e2e-spec.ts`) | ✅ |
| AC-7 | FE unit tests cover wiki article page fetch sequencing + standalone feedback component submission flow | ✅ |

---

## 4. Current State in Codebase

- **Entities & migrations:** `WikiArticleFeedback` entity registered in `WikiModule`, `AppModule`, and `data-source.ts`; migration `1767001000000-AddWikiArticleFeedback.ts` creates table/indexes.
- **Guards:** `OptionalJwtAuthGuard` allows attaching user context when Authorization header is present, reused by feedback POST route.
- **Controllers/Service:** `WikiController` exposes summary + submit endpoints; `WikiService` implements persistence/upsert logic.
- **Frontend:** `WikiArticleFeedback` client component with i18n strings renders on wiki article pages, using initial SSR summary + authenticated POST via `Authorization` header if token exists.
- **Tests:**
  - Backend e2e `be/test/wiki-feedback.e2e-spec.ts`
  - Frontend: updated `wiki-article-page.test.tsx` (fetch sequence) + new `wiki-article-feedback.test.tsx`.

---

## 5. Implementation Notes

- Guest votes create distinct rows (no dedupe) while authenticated votes overwrite previous choice via the unique constraint.
- Summary endpoint caches nothing (cheap counts). Future performance optimizations can use materialized views if needed.
- Frontend purposely avoids extra fetch on mount when SSR summary exists; on vote it refetches summary for freshness.
- Errors during POST are surfaced as localized inline errors; summary fetch failures are silently ignored to keep UX resilient.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Story spec created, implementation delivered (BE model/API/tests + FE UI/tests) |
