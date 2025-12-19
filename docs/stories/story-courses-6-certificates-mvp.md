# STORY-COURSES-6: Certificates (MVP)

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: 🟡 In Progress_

---

## 1. Goal

Потребител, който е завършил курс (enrollment status `completed`), да може да види прост “certificate” screen (MVP) и BE да предоставя certificate payload.

---

## 2. Non-Goals

- PDF generation / download
- Unique certificate numbering / verification page
- Share links / public certificates

---

## 3. Acceptance Criteria

### 3.1 Backend

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/courses/:courseId/certificate` е защитен с JWT | ✅ |
| AC-2 | Ако няма enrollment → 403 | ✅ |
| AC-3 | Ако enrollment.status != `completed` → 403 | ✅ |
| AC-4 | Ако enrollment.status == `completed` → 200 + certificate payload | ✅ |

### 3.2 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | `/my-courses` показва линк/бутон “Certificate” само за completed courses | ✅ |
| AC-6 | `/my-courses/:courseId/certificate` показва certificate view | ✅ |

### 3.3 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | BE e2e test покрива 403 (not completed) и 200 (completed) | ✅ |

---

## 4. Implementation Notes

- Certificate “completedAt” за MVP се базира на `CourseEnrollment.updatedAt` (статусът се обновява и `updated_at` се refresh-ва).

---

## 5. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec |
