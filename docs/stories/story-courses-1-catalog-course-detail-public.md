# STORY-COURSES-1: Course Catalog + Course Detail (Public)

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Публичен каталог от курсове + публична детайлна страница за курс.

- Потребител (без login) може да види списък с активните курсове.
- Потребител (без login) може да види детайли за конкретен активен курс, включително curriculum (списък от items).
- UI показва дали курсът е free/paid + цена (ако е налична).

---

## 2. Non-Goals

- Реално „записване“ (enroll) и „My courses“ (STORY-COURSES-2)
- Unlock / payment flow за paid courses (STORY-COURSES-4 / payments epic)
- Защита на course detail с auth (detail е публичен)
- Консумация на съдържание (course wiki article), tasks, quizzes (други stories)

---

## 3. Acceptance Criteria

### 3.1 Public Catalog API (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/courses` връща списък от **active** курсове | ✅ |
| AC-2 | Response включва `id`, `title`, `description`, `language`, `status`, `isPaid`, `currency`, `priceCents` | ✅ |
| AC-3 | Inactive курсове не се връщат в каталога | ✅ |

### 3.2 Public Course Detail API (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | `GET /api/courses/:courseId` връща детайл за **active** курс | ✅ |
| AC-5 | Response включва `curriculum` (items) с `itemType`, `title`, `order`, `wikiSlug/taskId/quizId` | ✅ |
| AC-6 | При невалиден `courseId` или inactive курс → `404` | ✅ |

### 3.3 Public Catalog Page (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | `/courses` показва публичен списък от курсове | ✅ |
| AC-8 | Всеки курс е link към `/courses/:courseId` | ✅ |
| AC-9 | UI показва badge `Free/Paid` и цена при paid курс (ако има `currency` + `priceCents`) | ✅ |
| AC-10 | При грешка при зареждане се показва user-friendly error state | ✅ |
| AC-11 | При празен списък се показва empty state | ✅ |

### 3.4 Public Course Detail Page (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-12 | `/courses/:courseId` показва title/description/metadata | ✅ |
| AC-13 | При `404` от API се показва Next.js `notFound()` page | ✅ |
| AC-14 | Curriculum items се визуализират; за `wiki` item с `wikiSlug` се показва link към `/courses/:courseId/wiki/:slug?lang=...` | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Public endpoints:
  - `be/src/courses/courses.controller.ts`
    - `GET /courses` → `getPublicCatalog()`
    - `GET /courses/:courseId` → `getPublicCourseDetail()`
- Service:
  - `be/src/courses/courses.service.ts`
    - `getPublicCatalog()`
    - `getPublicCourseDetail()`
    - `loadCurriculum()` + DTO mapping
- Entities:
  - `be/src/courses/course.entity.ts`
  - `be/src/courses/course-curriculum-item.entity.ts`
- DTOs:
  - `be/src/courses/dto/course-summary.dto.ts`
  - `be/src/courses/dto/course-detail.dto.ts`
  - `be/src/courses/dto/course-module-item.dto.ts`
- Migrations:
  - `be/src/migrations/1765930000000-InitCourseSchema.ts`
  - `be/src/migrations/1765933000000-InitCourseCurriculumSchema.ts`
  - `be/src/migrations/1765932100000-AddIsPaidToCourses.ts`
  - `be/src/migrations/1765936200000-AddPricingToCourses.ts`

### 4.2 Frontend

- Public catalog page:
  - `fe/src/app/courses/page.tsx`
- Public course detail page:
  - `fe/src/app/courses/[courseId]/page.tsx`

---

## 5. Test Plan

### 5.1 BE e2e

- `be/test/courses.e2e-spec.ts`
  - `GET /api/courses` → 200, list
  - `GET /api/courses/:courseId` → 200, detail + curriculum array
  - `GET /api/courses/:courseId` unknown → 404

---

## 6. API Reference

### GET /api/courses

**Auth:** Not required

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Course Title",
    "description": "...",
    "language": "bg",
    "status": "active",
    "isPaid": false,
    "currency": null,
    "priceCents": null
  }
]
```

### GET /api/courses/:courseId

**Auth:** Not required

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Course Title",
  "description": "...",
  "language": "bg",
  "status": "active",
  "isPaid": true,
  "currency": "EUR",
  "priceCents": 9900,
  "curriculum": [
    {
      "id": "uuid",
      "itemType": "wiki",
      "title": "Intro",
      "order": 1,
      "wikiSlug": "intro",
      "taskId": null,
      "quizId": null
    }
  ]
}
```

**Errors:**
- `404 Not Found` — курсът не съществува или не е `active`

---

## 7. Dependencies

- STORY-WIKI-2 (Article by slug + language selection) — за реално рендериране на wiki съдържание
- STORY-COURSES-2 (Enrollment + My Courses) — за enroll / progress UI (интегрирано в detail page)

---

## 8. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-21 | Cascade | Documented existing implementation as STORY-COURSES-1 |
