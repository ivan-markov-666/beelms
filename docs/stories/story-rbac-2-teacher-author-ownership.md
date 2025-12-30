# STORY-RBAC-2: Teacher/Author Ownership (Courses + Wiki)

_BMAD Story Spec | EPIC: EPIC-CORE-RBAC | Status: 🟡 Planned_

---

## 1. Goal

Да приложим ownership ограничения за ролите **Teacher** и **Author**, както е в Product Brief:

- Teacher вижда/управлява **само свои** курсове (и техния curriculum), освен ако е admin.
- Author вижда/управлява **само свои** wiki статии, освен ако е admin.

Това е ключово за “framework” модел, при който администраторът управлява всички ресурси, а creator roles са ограничени до собственото си съдържание.

---

## 2. Non-Goals

- Collaboration/teams (споделена собственост, co-authors)
- Ownership на quizzes/tasks отделно от курсовете
- Complex approval workflows

---

## 3. Acceptance Criteria

### 3.1 Backend: Data model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `Course` има поле `createdByUserId` (FK към users) | ⬜ |
| AC-2 | `WikiArticle` (или версията/коренният запис) има поле `createdByUserId` (FK към users) | ⬜ |
| AC-3 | При admin-created records, `createdByUserId` може да е admin user | ⬜ |

### 3.2 Backend: Enforcement for Courses

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | Admin courses endpoints филтрират резултати според ролята: teacher вижда само свои курсове | ⬜ |
| AC-5 | Teacher няма право да GET/UPDATE курс, който не е негов | ⬜ |
| AC-6 | Admin може да вижда/управлява всички курсове | ⬜ |

### 3.3 Backend: Enforcement for Wiki

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | Admin wiki endpoints филтрират резултати: author вижда само свои статии | ⬜ |
| AC-8 | Author няма право да UPDATE/CHANGE STATUS/ROLLBACK на статия, която не е негова | ⬜ |
| AC-9 | Admin може да вижда/управлява всички статии | ⬜ |

### 3.4 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Admin Courses UI показва само own courses за teacher | ⬜ |
| AC-11 | Admin Wiki UI показва само own articles за author | ⬜ |
| AC-12 | При forbidden access UI показва message и не “leak”-ва existence на чужди ресурси | ⬜ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Entities:
  - `be/src/courses/course.entity.ts` (add `createdByUserId`)
  - `be/src/wiki/wiki-article.entity.ts` (add `createdByUserId`) (или коренната таблица)
- Migrations:
  - `*-AddOwnershipToCourses.ts`
  - `*-AddOwnershipToWikiArticles.ts`
- Controllers/services:
  - `be/src/courses/admin-courses.controller.ts` + service: filter by `createdByUserId` unless admin
  - `be/src/wiki/admin-wiki.controller.ts` + service: filter by `createdByUserId` unless admin

**Role checks:**

- Teacher ownership applies when `role === 'teacher'`.
- Author ownership applies when `role === 'author'`.
- Admin bypass.

### 4.2 Frontend

- Reuse current admin pages:
  - `fe/src/app/admin/courses/*`
  - `fe/src/app/admin/wiki/*`

---

## 5. Test Plan

### 5.1 Backend e2e

- Teacher:
  - create course → can list and edit it
  - cannot view/edit чужд курс
- Author:
  - create wiki article → can list and edit it
  - cannot view/edit чужда статия

### 5.2 Frontend

- Unit: UI hides чужди items (based on API list filtering)

---

## 6. Notes

- Ако искаме да позволим admin да “reassign”-ва ownership, това е отделен story.
- В MVP може да се имплементира като “creator-only visibility” без допълнителни permission таблици.

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Created story spec for teacher/author ownership enforcement |
