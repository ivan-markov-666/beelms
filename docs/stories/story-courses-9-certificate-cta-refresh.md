# STORY-COURSES-9: Certificate CTA + Auto-refresh after Mark as Read

_BMAD Story Spec | EPIC: EPIC-CORE-COURSES-PROGRESS | Status: ✅ Implemented_

---

## 1. Goal

Когато потребителят маркира урок като прочетен (особено последния), UI да обнови прогреса и при 100% да покаже директен CTA към сертификата, без нужда от reload/навигация.

---

## 2. Non-Goals

- PDF/verification за сертификат
- Нови BE endpoints

---

## 3. Acceptance Criteria

### 3.1 Wiki lesson page

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | След успешен `Mark as read`, компонентът refresh-ва `/curriculum/progress` | ✅ |
| AC-2 | Ако след refresh прогресът стане 100%, показва CTA към сертификата | ✅ |

### 3.2 Course detail page

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | `CourseProgressPanel` може да refresh-не при event за обновен прогрес | ✅ |

### 3.3 Tests

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | FE unit test покрива: completed item + progress 100% → показва Certificate CTA | ✅ |

---

## 4. Implementation Notes

- Използваме `GET /api/courses/:courseId/curriculum/progress`.
- UI синхронизация: `window.dispatchEvent(new CustomEvent('course-progress-updated', { detail: { courseId } }))`.

---

## 5. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-19 | Cascade | Initial story spec |
| 2025-12-20 | Cascade | Marked as implemented (all AC ✅) |
