# STORY-COURSES-10: Course Categories (Catalog Grouping)

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Да добавим **категории за курсове** (както е в Product Brief), за да може публичният каталог и admin панелът да групират и филтрират курсовете.

MVP scope:

- categories CRUD (admin)
- assign category to course (admin)
- filter in public catalog (FE)

---

## 2. Non-Goals

- Multi-level category tree (parent/child)
- Tags/labels система
- SEO landing pages per category

---

## 3. Acceptance Criteria

### 3.1 Backend: Data model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има таблица `course_categories` (`id`, `slug`, `title`, `order`, `active`) | ⬜ |
| AC-2 | `courses` има `categoryId` nullable FK към `course_categories` | ⬜ |
| AC-3 | Migration-и са налични и работят на чиста база | ⬜ |

### 3.2 Backend: Public catalog API

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | `GET /api/courses` приема optional query `category=<slug>` | ⬜ |
| AC-5 | Response за course summary включва `category` (slug + title) или `null` | ⬜ |
| AC-6 | Има `GET /api/course-categories` за public списък (само active) | ⬜ |

### 3.3 Backend: Admin API

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | `GET /api/admin/course-categories` list | ⬜ |
| AC-8 | `POST /api/admin/course-categories` create | ⬜ |
| AC-9 | `PATCH /api/admin/course-categories/:id` update | ⬜ |
| AC-10 | Admin може да assign-ва категория на курс (напр. `PATCH /api/admin/courses/:id` или отделен endpoint) | ⬜ |

### 3.4 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-11 | `/courses` има category filter (dropdown/segments) | ⬜ |
| AC-12 | UI пази selection в querystring (shareable URL) | ⬜ |
| AC-13 | Admin course editor има поле за category | ⬜ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Entities:
  - `be/src/courses/course-category.entity.ts`
  - update `be/src/courses/course.entity.ts`
- Controllers:
  - public: `be/src/courses/courses.controller.ts` (`GET /courses`, `GET /course-categories`)
  - admin: `be/src/courses/admin-course-categories.controller.ts`
- Migrations:
  - `*-InitCourseCategories.ts`
  - `*-AddCourseCategoryToCourses.ts`

### 4.2 Frontend

- Public catalog:
  - `fe/src/app/courses/page.tsx`
- Admin course editor:
  - `fe/src/app/admin/courses/[courseId]/page.tsx` (или съответния edit UI)

---

## 5. Test Plan

### 5.1 Backend e2e

- create category (admin) → assign to course → public list returns category
- filter `GET /api/courses?category=...` returns only matching

### 5.2 Frontend

- unit: filter UI updates URL and fetches filtered list

---

## 6. Notes

- В MVP е ок да позволим course без категория.
- `slug` трябва да е уникален и URL-safe.

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Created story spec for course categories |
