# STORY-ADMIN-3: Admin Wiki versions history & rollback

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Да позволи на редакторите да инспектират и управляват историята на промените по Wiki статиите, включително diff между версии и rollback към по-стара публикация.

---

## 2. Non-Goals

- Real-time collaborative editing
- Branching/approval workflows
- Automatic version comparison за всички езици едновременно (работим per-language)

---

## 3. Acceptance Criteria

### 3.1 Version History API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/wiki/:slug/versions?language=` връща списък с версии за езика (published & draft) | ✅ |
| AC-2 | Всяка версия включва `version`, `language`, `title`, `published`, `updatedBy`, `updatedAt`, `diffSummary` | ✅ |
| AC-3 | `GET /api/admin/wiki/:slug/versions/:versionId/diff?language=` връща structured diff (added/removed paragraphs) | ✅ |
| AC-4 | `POST /api/admin/wiki/:slug/versions/:versionId/rollback` копира избраната версия в нова draft/published версия | ✅ |

### 3.2 Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Edit страницата има раздел „Version history“ с timeline/table и филтър по език | ✅ |
| AC-6 | Diff viewer показва side-by-side сравнение (markdown → HTML) | ✅ |
| AC-7 | Rollback action има двустепенно потвърждение и показва toast при успех | ✅ |

### 3.3 Security

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | Само admins могат да достъпват history/diff/rollback endpoints | ✅ |
| AC-9 | Rollback се логва в AdminActivity | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- Controller: `be/src/wiki/admin-wiki-versions.controller.ts`
- Service: `be/src/wiki/wiki.service.ts` (`getVersionHistory`, `getVersionDiff`, `rollbackVersion`)
- Entities: `WikiArticleVersion`
- Helpers: Markdown diff utility (`wiki-version-diff.utils.ts`)

### Frontend
- Component: `WikiVersionHistoryPanel`
- Diff viewer: `WikiVersionDiffModal`
- Hooks: `useAdminWikiVersions`

### Tests
- BE e2e: `be/test/admin-wiki-versions.e2e-spec.ts`
- FE unit: `wiki-version-history-panel.test.tsx`

---

## 5. Notes
- Rollback създава нова версия със същото съдържание, вместо да модифицира старата (за да пазим immutable history).
- Diff util работи върху markdown AST за по-точни сравнения.
- API е оптимизиран с pagination (limit 50) и indexes върху `(article_id, language, version_number)`.
