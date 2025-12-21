# beelms core – EPIC & Story Map

_Роля: PM / Tech Lead. Фаза: BMAD Solutioning → Create-epics-and-stories._

## 1. Каноничен модел (source of truth)

Този документ е **каноничният списък** с EPIC-и и Story-level breakdown за MVP.

---

## 2. MVP EPIC-и (v1)

### EPIC-CORE-WIKI-CONTENT (FR-WIKI)

- **Goal:** публична Wiki (list + article), многоезични версии на статии.
- **Stories (high level):**
  - STORY-WIKI-1 Public list + search/filter
  - STORY-WIKI-2 Article by slug + language selection
  - STORY-WIKI-3 Admin управляеми статуси (Draft/Active/Inactive) (частично може да отиде в Admin EPIC)

### EPIC-CORE-AUTH-ACCOUNTS (FR-AUTH)

- **Goal:** регистрация/login + профил + GDPR delete/export.
- **Stories (high level):**
  - STORY-AUTH-1 Register/Login
  - STORY-AUTH-2 Forgot/Reset password
  - STORY-AUTH-3 Profile + change email/password (ако е в scope)
  - STORY-AUTH-4 GDPR delete/export

### EPIC-CORE-COURSES-PROGRESS (FR-COURSES)

- **Goal:** Course catalog + enrollment + My Courses + базов прогрес.
- **Stories (high level):**
  - STORY-COURSES-1 Course catalog + course detail (public)
  - STORY-COURSES-2 Enrollment + My Courses list
  - STORY-COURSES-3 Basic progress (Not Started / In Progress / Completed)

### EPIC-CORE-TASKS (FR-TASKS)

- **Goal:** Практически задачи в курсовете + маркиране на изпълнение (MVP).
- **Stories (high level):**
  - STORY-TASKS-1 Task item в курс (title/description)
  - STORY-TASKS-2 Mark task as completed (affects progress)

### EPIC-CORE-ASSESSMENTS (FR-ASSESSMENTS)

- **Goal:** Базови quizzes (MCQ) – load/submit + резултат.
- **Stories (high level):**
  - STORY-ASSESSMENTS-1 Quiz definition (questions/options) ✅ Implemented
  - STORY-ASSESSMENTS-2 Quiz delivery + submit + scoring ✅ Implemented
  - STORY-ASSESSMENTS-3 Persist attempts/results ✅ Implemented (stores attempts with score/passed and submitted answers)

### EPIC-CORE-ADMIN (FR-ADMIN)

- **Goal:** Admin UI/API за Wiki/Users/Metrics + Courses/Quizzes (MVP).
- **Stories (high level):**
  - STORY-ADMIN-1 Admin Users list + activate/deactivate
  - STORY-ADMIN-2 Admin Wiki management (CRUD + status)
  - STORY-ADMIN-3 Admin Wiki versions (list/rollback/delete)
  - STORY-ADMIN-4 Admin Metrics overview (total users)
  - STORY-ADMIN-5 Admin Courses management (CRUD + status + curriculum)
  - STORY-ADMIN-6 Admin Quizzes management (CRUD + questions + linking)

### EPIC-CORE-CROSS-GDPR-LEGAL (FR-CROSS + FR-LEGAL)

- **Goal:** публични legal страници + GDPR изисквания (вкл. checkbox при регистрация).
- **Stories (high level):**
  - STORY-LEGAL-1 Terms/Privacy/About/Contact pages + footer links
  - STORY-LEGAL-2 Terms/Privacy acceptance in register flow

### EPIC-CROSS-I18N

- **Goal:** глобално i18n поведение (BG/EN) и правила.
- **Spec:** `docs/architecture/epic-cross-i18n.md`

### EPIC-CORE-DX-CLI-INFRA

- **Goal:** DX tooling + reproducible dev/test среда.
- **Stories (high level):**
  - STORY-DX-1 docker-compose dev workflow
  - STORY-DX-2 migrations/seed workflow
  - STORY-DX-3 create-beelms-app (ако е в scope)

---

## 3. Walking Skeleton mapping

- **WS-1:** Wiki public (EPIC-CORE-WIKI-CONTENT)
- **WS-2:** Auth skeleton (EPIC-CORE-AUTH-ACCOUNTS)
- **WS-3:** Courses & Assessments skeleton (EPIC-CORE-COURSES-PROGRESS, EPIC-CORE-TASKS, EPIC-CORE-ASSESSMENTS)
- **WS-4:** Admin skeleton (EPIC-CORE-ADMIN)
