# STORY-ADMIN-5: Admin Courses Management (CRUD + Status + Curriculum)

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Админ UI/API за управление на курсове (MVP):

- CRUD операции върху курсове (създаване, списък, детайл, редакция)
- Управление на `status` (`draft/active/inactive`)
- Управление на pricing за платени курсове (`isPaid`, `currency`, `priceCents`)
- Управление на curriculum (подредба, edit, delete на items)
- Admin “grant access” за платени курсове (purchase + optionally enroll)

---

## 2. Non-Goals

- Пълно изтриване на course record (hard delete) през Admin UI
- CRUD за tasks/quizzes entities (отделни stories)
- Управление на course thumbnail/media
- Advanced bulk operations (bulk status changes, bulk curriculum import)

---

## 3. Acceptance Criteria

### 3.1 Admin Courses: List + Detail + Create + Update

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/courses` връща списък с всички курсове (вкл. inactive/draft) | ✅ |
| AC-2 | `GET /api/admin/courses/:courseId` връща детайл за курс + curriculum | ✅ |
| AC-3 | `POST /api/admin/courses` създава курс (минимум: title/description/language/status) | ✅ |
| AC-4 | `PATCH /api/admin/courses/:courseId` обновява курс (частичен update) | ✅ |
| AC-5 | Course status поддържа `draft/active/inactive` | ✅ |

### 3.2 Pricing Rules (Paid courses)

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | При `isPaid=true` се изискват валидни `currency` (3 letters) и `priceCents` (>0 integer) | ✅ |
| AC-7 | При `isPaid=false` backend нормализира `currency=null` и `priceCents=null` | ✅ |

### 3.3 Admin Curriculum Management

| # | Criterion | Status |
|---|-----------|--------|
| AC-8 | `GET /api/admin/courses/:courseId/curriculum` връща items по `order` | ✅ |
| AC-9 | `POST /api/admin/courses/:courseId/curriculum` добавя curriculum item (wiki/task/quiz) | ✅ |
| AC-10 | Ако се подаде `order`, insert е stable: existing items shift-ват надолу | ✅ |
| AC-11 | `PATCH /api/admin/courses/:courseId/curriculum/:itemId` позволява update на title/refs и reorder | ✅ |
| AC-12 | `DELETE /api/admin/courses/:courseId/curriculum/:itemId` изтрива item и reindexes order | ✅ |
| AC-13 | За `itemType=wiki` се валидира, че slug съществува и има published версия за езика на курса | ✅ |
| AC-14 | `course_only` wiki статии могат да се ползват в curriculum (но пак трябва да имат published версия за езика) | ✅ |

### 3.4 Admin Grants (Paid course access)

| # | Criterion | Status |
|---|-----------|--------|
| AC-15 | `POST /api/admin/courses/:courseId/grants` може да grant-не достъп до paid курс (purchase) | ✅ |
| AC-16 | Grant е idempotent и може да revive-не revoked purchase | ✅ |
| AC-17 | По подразбиране grant прави и enroll (може да се disable-не с `enroll=false`) | ✅ |

### 3.5 Security

| # | Criterion | Status |
|---|-----------|--------|
| AC-18 | Всички admin endpoints изискват JWT + admin role | ✅ |
| AC-19 | Без token → 401, non-admin → 403 | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Admin course endpoints:
  - `be/src/courses/admin-courses.controller.ts`
    - `GET /admin/courses`
    - `GET /admin/courses/:courseId`
    - `POST /admin/courses`
    - `PATCH /admin/courses/:courseId`
    - `POST /admin/courses/:courseId/grants`
  - `be/src/courses/courses.service.ts`
    - `getAdminCoursesList()`
    - `getAdminCourseDetail()`
    - `adminCreateCourse()`
    - `adminUpdateCourse()`
    - `adminGrantCourseAccess()`

- Admin curriculum endpoints:
  - `be/src/courses/admin-course-curriculum.controller.ts`
    - `GET /admin/courses/:courseId/curriculum`
    - `POST /admin/courses/:courseId/curriculum`
    - `PATCH /admin/courses/:courseId/curriculum/:itemId`
    - `DELETE /admin/courses/:courseId/curriculum/:itemId`
  - `be/src/courses/courses.service.ts`
    - `getAdminCourseCurriculum()`
    - `adminAddCurriculumItem()` (insert + stable ordering)
    - `adminUpdateCurriculumItem()` (update + reorder)
    - `adminDeleteCurriculumItem()` (delete + reindex)
    - `validateWikiSlugExistsForCurriculum()` (валидира slug + published версия за езика)

- Entities:
  - `be/src/courses/course.entity.ts`
  - `be/src/courses/course-curriculum-item.entity.ts`
  - `be/src/courses/course-enrollment.entity.ts`
  - `be/src/courses/course-purchase.entity.ts`

- DTOs:
  - `be/src/courses/dto/admin-create-course.dto.ts`
  - `be/src/courses/dto/admin-update-course.dto.ts`
  - `be/src/courses/dto/admin-create-course-curriculum-item.dto.ts`
  - `be/src/courses/dto/admin-update-course-curriculum-item.dto.ts`
  - `be/src/courses/dto/admin-grant-course-access.dto.ts`

- Migrations (courses + curriculum):
  - `be/src/migrations/1765930000000-InitCourseSchema.ts`
  - `be/src/migrations/1765931000000-InitCourseEnrollmentSchema.ts`
  - `be/src/migrations/1765933000000-InitCourseCurriculumSchema.ts`
  - `be/src/migrations/1765932100000-AddIsPaidToCourses.ts`
  - `be/src/migrations/1765936200000-AddPricingToCourses.ts`

### 4.2 Frontend

- Admin courses list + create:
  - `fe/src/app/admin/courses/page.tsx`

- Admin course detail + edit + curriculum UI:
  - `fe/src/app/admin/courses/[courseId]/page.tsx`

---

## 5. Test Plan

### 5.1 BE e2e

- `be/test/admin-courses.e2e-spec.ts`
  - 401 без token, 403 non-admin
  - create/list/detail/update
  - pricing (paid create + patch isPaid false)

- `be/test/admin-course-curriculum.e2e-spec.ts`
  - add/move/update/delete curriculum items
  - stable ordering rules
  - wikiSlug validation (course_only allowed, missing translation rejected)

- `be/test/admin-course-grants.e2e-spec.ts`
  - grant paid course access creates purchase + enrollment (idempotent)

---

## 6. Notes

- В момента няма отделен `DELETE /api/admin/courses/:courseId` endpoint. За MVP това е окей (safe approach: деактивация чрез `status='inactive'`).
- Admin UI поддържа добавяне на curriculum item тип `wiki` (task/quiz са налични в BE DTO, но не са exposed в UI).

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented existing admin courses + curriculum management implementation as STORY-ADMIN-5 |
