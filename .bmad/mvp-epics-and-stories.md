# BMAD MVP Epics and User Stories

_Business Model Analysis Document for MVP Version_

---

## EPIC-AUTH: User Authentication and Account Management

**Goal:** Provide secure user registration, login, and account management features.

**Stories:**
- [story-auth-1-register-login.md](docs/stories/story-auth-1-register-login.md) - Basic register and login
- [story-auth-2-forgot-reset-password.md](docs/stories/story-auth-2-forgot-reset-password.md) - Password recovery
- [story-auth-3-profile-email-password.md](docs/stories/story-auth-3-profile-email-password.md) - Profile management
- [story-auth-4-gdpr-delete-export.md](docs/stories/story-auth-4-gdpr-delete-export.md) - GDPR compliance
- [story-legal-2-terms-privacy-acceptance-register.md](docs/stories/story-legal-2-terms-privacy-acceptance-register.md) - Terms acceptance
- [story-sec-1-csrf-strategy-jwt-browser-clients.md](docs/stories/story-sec-1-csrf-strategy-jwt-browser-clients.md) - Security measures
- [story-auth-5-social-login-google.md](docs/stories/story-auth-5-social-login-google.md) - Google OAuth login/registration
- [story-auth-6-social-login-facebook.md](docs/stories/story-auth-6-social-login-facebook.md) - Facebook OAuth login/registration
- [story-auth-7-social-login-linkedin.md](docs/stories/story-auth-7-social-login-linkedin.md) - LinkedIn OAuth login/registration
- [story-auth-8-social-login-github.md](docs/stories/story-auth-8-social-login-github.md) - GitHub OAuth login/registration

---

## EPIC-WIKI: Wiki Content Management and Consumption

**Goal:** Enable creation, editing, and viewing of wiki articles with versioning and feedback.

**Stories:**
- [story-wiki-1-public-list-search-filter.md](docs/stories/story-wiki-1-public-list-search-filter.md) - Public article browsing
- [story-wiki-2-public-article-and-language-switch.md](docs/stories/story-wiki-2-public-article-and-language-switch.md) - Article viewing
- [story-wiki-3-admin-statuses-draft-active-inactive.md](docs/stories/story-wiki-3-admin-statuses-draft-active-inactive.md) - Article management
- [story-wiki-1-admin-editor-upgrades.md](docs/stories/story-wiki-1-admin-editor-upgrades.md) - Admin editing features
- [story-wiki-post-1-article-feedback.md](docs/stories/story-wiki-post-1-article-feedback.md) - Article feedback
- [story-wiki-post-2-related-articles.md](docs/stories/story-wiki-post-2-related-articles.md) - Related articles
- [story-wiki-post-3-wiki-view-metrics.md](docs/stories/story-wiki-post-3-wiki-view-metrics.md) - View metrics

---

## EPIC-ADMIN: Administrative Functions

**Goal:** Provide admin tools for managing users, wiki content, and system metrics.

**Stories:**
- [story-admin-1-users-list-activation.md](docs/stories/story-admin-1-users-list-activation.md) - User management
- [story-admin-2-wiki-management-crud-status.md](docs/stories/story-admin-2-wiki-management-crud-status.md) - Wiki management
- [story-admin-3-wiki-versions-history.md](docs/stories/story-admin-3-wiki-versions-history.md) - Version history
- [story-admin-4-metrics-overview.md](docs/stories/story-admin-4-metrics-overview.md) - Metrics dashboard
- [story-admin-5-courses-management-crud-status-curriculum.md](docs/stories/story-admin-5-courses-management-crud-status-curriculum.md) - Course management
- [story-admin-6-quizzes-management-crud-linking.md](docs/stories/story-admin-6-quizzes-management-crud-linking.md) - Quiz management
- [story-admin-7-tasks-management.md](docs/stories/story-admin-7-tasks-management.md) - Task management
- [story-admin-8-activity-log.md](docs/stories/story-admin-8-activity-log.md) - Activity logging

---

## EPIC-COURSES: Course Management and Learning

**Goal:** Enable course creation, enrollment, and progress tracking for educational content.

**Stories:**
- [story-courses-1-catalog-course-detail-public.md](docs/stories/story-courses-1-catalog-course-detail-public.md) - Course catalog
- [story-courses-2-my-courses.md](docs/stories/story-courses-2-my-courses.md) - My courses
- [story-courses-3-progress-tracking.md](docs/stories/story-courses-3-progress-tracking.md) - Progress tracking
- [story-courses-4-paid-course-unlock.md](docs/stories/story-courses-4-paid-course-unlock.md) - Paid courses
- [story-courses-5-paid-ux-polish.md](docs/stories/story-courses-5-paid-ux-polish.md) - UX polish
- [story-courses-6-certificates-mvp.md](docs/stories/story-courses-6-certificates-mvp.md) - Certificates
- [story-courses-7-my-courses-polish.md](docs/stories/story-courses-7-my-courses-polish.md) - My courses polish
- [story-courses-8-course-progress-completion-ux.md](docs/stories/story-courses-8-course-progress-completion-ux.md) - Progress UX
- [story-courses-9-certificate-cta-refresh.md](docs/stories/story-courses-9-certificate-cta-refresh.md) - Certificate CTA
- [story-courses-10-course-categories.md](docs/stories/story-courses-10-course-categories.md) - Categories

---

## EPIC-ASSESSMENTS: Assessments and Quizzes

**Goal:** Provide quiz creation and delivery with scoring and persistence.

**Stories:**
- [story-assessments-1-quiz-definition.md](docs/stories/story-assessments-1-quiz-definition.md) - Quiz creation
- [story-assessments-2-quiz-delivery-submit-scoring.md](docs/stories/story-assessments-2-quiz-delivery-submit-scoring.md) - Quiz delivery
- [story-assessments-3-persist-attempts-results.md](docs/stories/story-assessments-3-persist-attempts-results.md) - Results persistence

---

## EPIC-PAYMENTS: Payment Processing

**Goal:** Integrate Stripe for course payments and handle webhooks.

**Stories:**
- [story-payments-1-stripe-checkout-test-mode.md](docs/stories/story-payments-1-stripe-checkout-test-mode.md) - Stripe checkout
- [story-payments-2-stripe-webhooks-prod-ready.md](docs/stories/story-payments-2-stripe-webhooks-prod-ready.md) - Webhooks
- [story-payments-4-refunds-disputes-revocation.md](docs/stories/story-payments-4-refunds-disputes-revocation.md) - Refunds
- [story-payments-5-stripe-async-payment-webhooks.md](docs/stories/story-payments-5-stripe-async-payment-webhooks.md) - Async webhooks
- [story-payments-6-reconciliation-retry-tooling.md](docs/stories/story-payments-6-reconciliation-retry-tooling.md) - Reconciliation

---

## EPIC-RBAC: Roles and Access Control

**Goal:** Implement role-based access control for users and teachers.

**Stories:**
- [story-rbac-1-roles-and-access-mvp.md](docs/stories/story-rbac-1-roles-and-access-mvp.md) - Roles and access
- [story-rbac-2-teacher-author-ownership.md](docs/stories/story-rbac-2-teacher-author-ownership.md) - Teacher ownership

---

## EPIC-SETTINGS: Settings and Configuration

**Goal:** Provide instance configuration and feature toggles.

**Stories:**
- [story-settings-1-instance-config-public.md](docs/stories/story-settings-1-instance-config-public.md) - Instance config
- [story-settings-2-feature-toggles-admin.md](docs/stories/story-settings-2-feature-toggles-admin.md) - Feature toggles
- [story-settings-3-legal-content-editor.md](docs/stories/story-settings-3-legal-content-editor.md) - Legal editor

---

## EPIC-LEGAL: Legal Compliance

**Goal:** Ensure legal pages and compliance features.

**Stories:**
- [story-legal-1-public-legal-pages.md](docs/stories/story-legal-1-public-legal-pages.md) - Legal pages

---

## EPIC-OPS: Operations and DevOps

**Goal:** Support deployment, migrations, and operational tasks.

**Stories:**
- [story-ops-1-automated-migrations-on-deploy.md](docs/stories/story-ops-1-automated-migrations-on-deploy.md) - Migrations
- [story-dx-1-docker-compose-dev-workflow.md](docs/stories/story-dx-1-docker-compose-dev-workflow.md) - Dev workflow
- [story-dx-2-migrations-seed-workflow.md](docs/stories/story-dx-2-migrations-seed-workflow.md) - Migrations seed
- [story-dx-3-create-beelms-app.md](docs/stories/story-dx-3-create-beelms-app.md) - Create app

---

## EPIC-CROSS: Cross-cutting Concerns

**Goal:** Handle internationalization, security, and other cross-cutting features.

**Stories:**
- [story-mvp-cross-i18n-persistence.md](docs/stories/story-mvp-cross-i18n-persistence.md) - I18n persistence
- [story-tasks-1-task-item-in-course.md](docs/stories/story-tasks-1-task-item-in-course.md) - Tasks
- [story-tasks-2-mark-task-completed.md](docs/stories/story-tasks-2-mark-task-completed.md) - Task completion
- [story-docs-1-openapi-sync.md](docs/stories/story-docs-1-openapi-sync.md) - OpenAPI sync
- [story-mtx-post-1-advanced-admin-metrics.md](docs/stories/story-mtx-post-1-advanced-admin-metrics.md) - Advanced metrics

---

## MVP Scope Summary

**Core MVP Features:**
- User authentication (register, login, password reset)
- Wiki article creation, editing, viewing, search
- Admin dashboard for user and content management
- Basic course structure (catalog, enrollment, progress)
- Quiz/assessment system
- Payment integration for paid courses
- I18n support (BG/EN/DE)
- GDPR compliance features

**Post-MVP Features:**
- Advanced admin metrics
- Related articles
- Article feedback system
- Certificates
- Advanced RBAC
- Full payment reconciliation

**Implementation Status:** Most core features implemented, testing in progress, ready for MVP deployment.
