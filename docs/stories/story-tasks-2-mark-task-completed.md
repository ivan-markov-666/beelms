# STORY-TASKS-2: Mark Task as Completed (affects progress)

_BMAD Story Spec | EPIC: EPIC-CORE-TASKS | Status: ✅ Done_

---

## 1. Goal

Записан потребител може да маркира task curriculum item като завършен, което влияе на course progress (percent) и enrollment status.

---

## 2. Non-Goals

- Проверка на съдържанието на решението
- Scoring/points
- Un-complete (toggle) в MVP

---

## 3. Acceptance Criteria

### 3.1 Completion API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `POST /api/courses/:courseId/curriculum/:itemId/complete` работи и за `task` items | ✅ |
| AC-2 | Completion е idempotent (втори call не чупи) | ✅ (вече е така) |
| AC-3 | Completion изисква enrollment | ✅ (вече е така) |
| AC-4 | Completion update-ва enrollment status и certificate gating | ✅ (вече е така) |

### 3.2 Learner UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | В course UI има CTA за маркиране на task като завършен | ✅ |
| AC-6 | Course progress panel показва task items и completed state | ✅ (generic) |

---

## 4. Current State in Codebase

- BE:
  - `be/src/courses/curriculum-progress.controller.ts` вече има `POST :itemId/complete`.
  - `CoursesService.markCurriculumItemCompleted()` работи за всякакъв curriculum itemId.
- FE:
  - `MarkAsReadButton` е специализиран за `wiki` (намира itemId по wikiSlug и вика complete endpoint).
  - Course progress panel е generic и показва items като completed/not.

---

## 5. Implementation Notes

- Най-лесен MVP: да направим `MarkTaskCompletedButton` аналогично на `MarkAsReadButton`, но да търси `itemType === 'task'` + `taskId`.
- Трябва да има Task detail view за learner (например под `/courses/:courseId/tasks/:taskId`) или да показваме task description inline.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec for TASKS-2 |
