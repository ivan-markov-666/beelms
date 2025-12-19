# STORY-COURSES-3: Basic Progress Tracking

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Автоматично проследяване на прогреса на потребителя в курса. Статусът се обновява динамично без ръчна намеса, единствено с бутон "Маркирай като прочетено" за curriculum items.

---

## 2. Non-Goals

- **Manual status override** — потребителят не може ръчно да избира статус
- **Detailed analytics** — детайлна статистика за време прекарано в материали
- **Uncomplete action** — няма функционалност за премахване на маркирано като прочетено
- **Progress by quiz/task score** — прогресът се базира само на completion, не на резултати

---

## 3. Acceptance Criteria

### 3.1 Automatic Status Transitions

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | При enroll статусът е `not_started` | ✅ |
| AC-2 | При първи completed item статусът автоматично става `in_progress` | ✅ |
| AC-3 | При всички completed items статусът автоматично става `completed` | ✅ |
| AC-4 | `progressPercent` се изчислява като `(completed / total) * 100` | ✅ |

### 3.2 Mark Item as Completed (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | `POST /api/courses/:courseId/curriculum/:itemId/complete` маркира item като завършен | ✅ |
| AC-6 | Повторно маркиране е idempotent (не създава duplicate) | ✅ |
| AC-7 | Request без token връща 401 | ✅ |
| AC-8 | Request без enrollment връща 403 | ✅ |
| AC-9 | Request за несъществуващ item връща 404 | ✅ |

### 3.3 Get Progress (BE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | `GET /api/courses/:courseId/curriculum/progress` връща детайлен прогрес | ✅ |
| AC-11 | Response включва `totalItems`, `completedItems`, `progressPercent` | ✅ |
| AC-12 | Response включва списък с items и техния completion status | ✅ |
| AC-13 | Request без token връща 401 | ✅ |
| AC-14 | Request без enrollment връща 403 | ✅ |

### 3.4 My Courses Progress

| # | Criterion | Status |
|---|-----------|--------|
| AC-15 | `GET /api/users/me/courses` връща `progressPercent` за всеки курс | ✅ |
| AC-16 | `enrollmentStatus` се обновява автоматично при промяна на прогреса | ✅ |

### 3.5 Mark as Read Button (FE)

| # | Criterion | Status |
|---|-----------|--------|
| AC-17 | Бутон "Маркирай като прочетено" се показва в края на course wiki article | ✅ |
| AC-18 | След маркиране бутонът се заменя с ✅ "Прочетено" | ✅ |
| AC-19 | Бутонът се показва само за enrolled users | ✅ |

---

## 4. Technical Implementation

### 4.1 Backend

| Component | File | Description |
|-----------|------|-------------|
| Entity | `be/src/courses/user-curriculum-progress.entity.ts` | Progress tracking per item |
| Migration | `be/src/migrations/1765934000000-InitUserCurriculumProgressSchema.ts` | DB schema |
| Controller | `be/src/courses/curriculum-progress.controller.ts` | Progress endpoints |
| Service | `be/src/courses/courses.service.ts` | `markCurriculumItemCompleted()`, `getCurriculumProgress()`, `calculateProgressPercent()`, `updateEnrollmentStatus()` |

### 4.2 Frontend

| Component | File | Description |
|-----------|------|-------------|
| Button | `fe/src/app/courses/_components/mark-as-read-button.tsx` | Mark as read UI |
| Page | `fe/src/app/courses/[courseId]/wiki/[slug]/page.tsx` | Integrated button |

### 4.3 Database

```
user_curriculum_progress
├── id (uuid, PK)
├── user_id (uuid, FK → users.id)
├── course_id (uuid, FK → courses.id)
├── curriculum_item_id (uuid, FK → course_curriculum_items.id)
├── completed_at (timestamp, nullable)
├── created_at (timestamp)
└── UNIQUE(user_id, curriculum_item_id)
```

---

## 5. Test Plan

### 5.1 E2E Tests

| Test File | Scenarios |
|-----------|-----------|
| `curriculum-progress.e2e-spec.ts` | 401 without token, 403 without enrollment, progress for enrolled user, mark complete updates progress, all items completed = status completed, in_progress status, idempotent marking |

---

## 6. API Reference

### POST /api/courses/:courseId/curriculum/:itemId/complete

**Auth:** Required (JWT)

**Response:**
- `204 No Content` — успешно маркиране
- `401 Unauthorized` — липсва token
- `403 Forbidden` — не е enrolled
- `404 Not Found` — item не съществува

### GET /api/courses/:courseId/curriculum/progress

**Auth:** Required (JWT)

**Response:** `200 OK`
```json
{
  "totalItems": 5,
  "completedItems": 2,
  "progressPercent": 40,
  "items": [
    {
      "id": "uuid",
      "title": "Lesson 1",
      "itemType": "wiki",
      "wikiSlug": "intro",
      "completed": true,
      "completedAt": "2025-12-19T10:00:00.000Z"
    }
  ]
}
```

---

## 7. Dependencies

- STORY-COURSES-2 (Enrollment + My Courses) — required for enrollment check

---

## 8. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial implementation |
