# beelms core – EPIC & Story Map

_Роля: PM / Tech Lead. Фаза: BMAD Solutioning → Create-epics-and-stories._

## 1. Каноничен модел (source of truth)

Този документ е **каноничният списък** с EPIC-и и Story-level breakdown.

Включва:
- MVP EPIC-и (v1)
- Допълнителни shipped/optional/post-MVP EPIC-и (за traceability към наличните story specs)

---

## 2.1 MVP EPIC-и (v1)

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
  - STORY-COURSES-4 Paid Course Unlock (MVP)
  - STORY-COURSES-5 Paid UX Polish
  - STORY-COURSES-6 Certificates (MVP)
  - STORY-COURSES-7 My Courses Dashboard Polish
  - STORY-COURSES-8 Course Progress & Completion UX (MVP)
  - STORY-COURSES-9 Certificate CTA + Auto-refresh after Mark as Read
  - STORY-COURSES-10 Course categories (catalog grouping)

### EPIC-CORE-TASKS (FR-TASKS)

- **Goal:** Практически задачи в курсовете + маркиране на изпълнение (MVP).
- **Stories (high level):**
  - STORY-TASKS-1 Task item в курс (title/description)
  - STORY-TASKS-2 Mark task as completed (affects progress)

### EPIC-CORE-ASSESSMENTS (FR-ASSESSMENTS)

- **Goal:** Базови quizzes (MCQ) – load/submit + резултат.
- **Stories (high level):**
  - STORY-ASSESSMENTS-1 Quiz definition (questions/options) 
  - STORY-ASSESSMENTS-2 Quiz delivery + submit + scoring 
  - STORY-ASSESSMENTS-3 Persist attempts/results 

### EPIC-CORE-ADMIN (FR-ADMIN)

- **Goal:** Admin UI/API за Wiki/Users/Metrics + Courses/Quizzes (MVP).
- **Stories (high level):**
  - STORY-ADMIN-1 Admin Users list + activate/deactivate
  - STORY-ADMIN-2 Admin Wiki management (CRUD + status)
  - STORY-ADMIN-3 Admin Wiki versions (list/rollback/delete)
  - STORY-ADMIN-4 Admin Metrics overview (total users)
  - STORY-ADMIN-5 Admin Courses management (CRUD + status + curriculum)
  - STORY-ADMIN-6 Admin Quizzes management (CRUD + questions + linking)
  - STORY-ADMIN-7 Admin Tasks management (CRUD + status)
  - STORY-ADMIN-8 Admin Activity Log (Wiki + Users)
  - STORY-WIKI-ADMIN-1 Admin Wiki editor upgrades

### EPIC-CORE-INSTANCE-SETTINGS (FR-SETTINGS)

- **Goal:** Instance config (branding + settings) + admin feature toggles + admin legal content.
- **Stories (high level):**
  - STORY-SETTINGS-1 Instance Config (Branding + Public Settings Read)
  - STORY-SETTINGS-2 Feature Toggles Admin (Modules + Infra + Languages)
  - STORY-SETTINGS-3 Admin Legal Content Editor (Terms/Privacy)

### EPIC-CORE-RBAC (FR-RBAC)

- **Goal:** роли, права и ownership (teacher/author) + monitoring access до метрики.
- **Stories (high level):**
  - STORY-RBAC-1 Roles & Access Control (Admin/Monitoring/Teacher/Author)
  - STORY-RBAC-2 Teacher/Author Ownership (Courses + Wiki)

### EPIC-CORE-API-CONTRACT (FR-DOCS)

- **Goal:** OpenAPI спецификацията е в sync с реалните MVP endpoints.
- **Stories (high level):**
  - STORY-DOCS-1 OpenAPI Sync (API Contract as Source of Truth)

### EPIC-CORE-CROSS-GDPR-LEGAL (FR-CROSS + FR-LEGAL)

- **Goal:** публични legal страници + GDPR изисквания (вкл. checkbox при регистрация).
- **Stories (high level):**
  - STORY-LEGAL-1 Terms/Privacy/About/Contact pages + footer links
  - STORY-LEGAL-2 Terms/Privacy acceptance in register flow

### EPIC-CROSS-I18N

- **Goal:** глобално i18n поведение (BG/EN) и правила.
- **Spec:** `docs/architecture/epic-cross-i18n.md`
- **Stories (high level):**
  - STORY-MVP-CROSS-I18N-PERSISTENCE Persist language (cookie) + SSR lang

### EPIC-CROSS-SECURITY

- **Goal:** Security decisions and protections (CSRF/XSS/SQLi/brute force) aligned with PRD.
- **Stories (high level):**
  - STORY-SEC-1 CSRF strategy for JWT + browser clients

## 2.2 Допълнителни EPIC-и (shipped / optional / post-MVP)

### EPIC-COURSES-PAID (FR-PAID)

- **Goal:** Paid courses + Stripe checkout flow.
- **Stories (high level):**
  - STORY-PAYMENTS-1 Stripe Checkout (Test Mode) for Paid Courses
  - STORY-PAYMENTS-2 Stripe Webhooks (Prod-ready)

### EPIC-PAYMENTS-OPS (FR-PAYMENTS-OPS)

- **Goal:** Ops hardening за payment lifecycle (webhook retries, revocation, reconciliation).
- **Stories (high level):**
  - STORY-PAYMENTS-4 Refunds / Disputes / Chargebacks (Access Revocation)
  - STORY-PAYMENTS-5 Stripe Async Payment Webhooks
  - STORY-PAYMENTS-6 Payments Ops - Reconciliation & Retry Tooling (MVP)

### EPIC-OPS (FR-OPS)

- **Goal:** Release / deploy operations.
- **Stories (high level):**
  - STORY-OPS-1 Automated DB Migrations on Deploy

### EPIC-POST-MVP-WIKI

- **Goal:** Post-MVP enhancements for public wiki.
- **Stories (high level):**
  - STORY-WIKI-POST-1 Wiki article helpful feedback (Post-MVP)
  - STORY-WIKI-POST-2 Related articles (Post-MVP)
  - STORY-WIKI-POST-3 Wiki view metrics (Post-MVP)

### EPIC-POST-MVP-METRICS

- **Goal:** Post-MVP advanced admin metrics.
- **Stories (high level):**
  - STORY-MTX-POST-1 Advanced admin metrics dashboard (privacy-friendly)

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
 - **WS-5:** Settings/RBAC/Contract (EPIC-CORE-INSTANCE-SETTINGS, EPIC-CORE-RBAC, EPIC-CORE-API-CONTRACT)
