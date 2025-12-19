# STORY-COURSES-2: Enrollment + My Courses List

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Позволява на регистрирани потребители да се записват в безплатни курсове и да преглеждат списък с курсовете, в които са записани, заедно с базов статус на прогреса.

---

## 2. Non-Goals

- **Paid courses enrollment** — платените курсове връщат 403 "Payment required" (payment flow е отделна story)
- **Detailed progress tracking** — детайлен прогрес по curriculum items (STORY-COURSES-3)
- **Course completion certificate** — сертификати при завършване (бъдеща функционалност)
- **Unenroll functionality** — отписване от курс (не е в MVP scope)

---

## 3. Acceptance Criteria

### 3.1 Enrollment (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `POST /api/courses/:courseId/enroll` създава enrollment record за authenticated user | ✅ |
| AC-2 | Enrollment за несъществуващ или inactive курс връща 404 | ✅ |
| AC-3 | Enrollment за paid курс връща 403 "Payment required" | ✅ |
| AC-4 | Повторен enroll на вече записан курс е idempotent (не създава duplicate) | ✅ |
| AC-5 | Enrollment без token връща 401 | ✅ |

### 3.2 My Courses API (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | `GET /api/users/me/courses` връща списък с курсове на authenticated user | ✅ |
| AC-7 | Inactive курсове се филтрират от резултата | ✅ |
| AC-8 | Response включва `enrollmentStatus` (not_started/in_progress/completed) и `enrolledAt` | ✅ |
| AC-9 | Request без token връща 401 | ✅ |
| AC-10 | Нов потребител (без enrollments) получава празен списък | ✅ |

### 3.3 My Courses Page (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-11 | `/my-courses` е достъпна само за logged-in потребители | ✅ |
| AC-12 | Неаутентициран потребител се redirect-ва към login | ✅ |
| AC-13 | Страницата показва списък с enrolled курсове или empty state | ✅ |
| AC-14 | Всеки курс показва title, language, enrollment status | ✅ |

### 3.4 Navigation (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-15 | "My Courses" линк се показва в главната навигация само за logged-in потребители | ✅ |
| AC-16 | Линкът не се показва за гости (hasToken === false) | ✅ |
| AC-17 | i18n ключ `nav.myCourses` е наличен за BG, EN, DE | ✅ |

---

## 4. Technical Implementation

### 4.1 Backend

| Component | File | Description |
|-----------|------|-------------|
| Controller | `be/src/courses/my-courses.controller.ts` | `GET /users/me/courses` endpoint |
| Controller | `be/src/courses/courses.controller.ts` | `POST /courses/:courseId/enroll` endpoint |
| Service | `be/src/courses/courses.service.ts` | `enrollInCourse()`, `getMyCourses()` methods |
| Entity | `be/src/courses/course-enrollment.entity.ts` | Enrollment entity with status field |
| DTO | `be/src/courses/dto/my-course-list-item.dto.ts` | Response DTO for my courses |

### 4.2 Frontend

| Component | File | Description |
|-----------|------|-------------|
| Page | `fe/src/app/my-courses/page.tsx` | My Courses page with auth guard |
| Nav Link | `fe/src/app/_components/header-nav.tsx` | Conditional "My Courses" link |
| i18n | `fe/src/i18n/messages.ts` | `nav.myCourses` translations |
| Button | `fe/src/app/courses/_components/enroll-course-button.tsx` | Enrollment UI |

### 4.3 Database

```
course_enrollment
├── id (uuid, PK)
├── courseId (uuid, FK → course.id)
├── userId (uuid, FK → user.id)
├── status (enum: not_started, in_progress, completed)
├── enrolledAt (timestamp)
└── UNIQUE(courseId, userId)
```

---

## 5. Test Plan

### 5.1 Unit Tests

| Test Suite | Coverage |
|------------|----------|
| `header-nav.test.tsx` | My Courses link visibility based on auth state |

### 5.2 E2E Tests (BE)

| Test File | Scenarios |
|-----------|-----------|
| `course-enrollment.e2e-spec.ts` | Enrollment flow, idempotency, paid course rejection |
| `course-enrollment.e2e-spec.ts` | GET /users/me/courses: 401, empty list, enrolled course appears, inactive filtered |

### 5.3 Manual Smoke Test

- [x] Login → "My Courses" link appears
- [x] Logout → "My Courses" link hidden
- [x] Navigate to `/my-courses` → shows enrolled courses
- [x] Enroll in free course → course appears in My Courses
- [x] Enroll in paid course → 403 error shown

---

## 6. API Reference

### POST /api/courses/:courseId/enroll

**Auth:** Required (JWT)

**Response:**
- `204 No Content` — успешен enroll
- `401 Unauthorized` — липсва token
- `403 Forbidden` — платен курс ("Payment required")
- `404 Not Found` — курсът не съществува или е inactive

### GET /api/users/me/courses

**Auth:** Required (JWT)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Course Title",
    "description": "...",
    "language": "en",
    "status": "active",
    "isPaid": false,
    "enrollmentStatus": "not_started",
    "progressPercent": null,
    "enrolledAt": "2025-12-19T08:00:00.000Z"
  }
]
```

---

## 7. Dependencies

- STORY-AUTH-1 (Register/Login) — required for enrollment
- STORY-COURSES-1 (Course catalog) — required for course existence

---

## 8. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial implementation complete |
| 2025-12-19 | Cascade | Added Suspense wrappers for Next.js 16 compatibility |
