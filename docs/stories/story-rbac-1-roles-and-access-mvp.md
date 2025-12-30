# STORY-RBAC-1: Roles & Access Control (Admin/Monitoring/Teacher/Author)

_BMAD Story Spec | EPIC: EPIC-CORE-RBAC | Status: ✅ Implemented_

---

## 1. Goal

Да формализираме MVP RBAC модел и enforcement в BE+FE, така че:

- системата да има ясни роли: `admin`, `user`, `monitoring`, `teacher`, `author`;
- администраторът да може да управлява ролите на потребителите;
- monitoring да има достъп само до агрегирани метрики (без PII);
- teacher/author да са разпознаваеми роли (ownership enforcement е в STORY-RBAC-2).

---

## 2. Non-Goals

- Пълна permission матрица по ресурси (fine-grained permissions)
- Multi-tenant RBAC (OrgID)
- Audit log за role changes

---

## 3. Acceptance Criteria

### 3.1 Backend: Role model

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `User.role` е ограничено до enum от стойности (`user/admin/monitoring/teacher/author`) | ⬜ |
| AC-2 | Има migration/constraint (или application-level validation) за допустимите роли | ⬜ |

### 3.2 Backend: Admin role management

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | `PATCH /api/admin/users/:id` позволява update на `role` (в допълнение към `active`) | ⬜ |
| AC-4 | Само `admin` може да сменя роли | ⬜ |
| AC-5 | Забранено е admin да демотира сам себе си (MVP safety) | ⬜ |

### 3.3 Backend: Monitoring access

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | Има `MonitoringGuard`/`RoleGuard`, който допуска `monitoring` и `admin` | ⬜ |
| AC-7 | Monitoring може да достъпва само metrics endpoints (агрегирани) | ⬜ |
| AC-8 | Monitoring няма достъп до admin users/wiki/courses/payments endpoints | ⬜ |

### 3.4 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-9 | Admin Users UI позволява промяна на role (dropdown) | ⬜ |
| AC-10 | Ако user е monitoring, admin UI показва само Metrics секция и скрива Users/Wiki/Courses/Settings | ⬜ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Role type:
  - `be/src/auth/user-role.ts` (enum/string union)
- User entity:
  - `be/src/auth/user.entity.ts` (switch `role: UserRole`)
- DTO updates:
  - `be/src/auth/dto/admin-update-user.dto.ts` (add optional `role`)
- Controller/service:
  - `be/src/auth/admin-users.controller.ts`
  - `be/src/auth/admin-users.service.ts`
- Guards:
  - `be/src/auth/admin.guard.ts` (keep for admin)
  - `be/src/auth/role.guard.ts` (generic allowed roles)
  - `be/src/auth/monitoring.guard.ts` (allowed roles: admin, monitoring)

Enforcement approach:

- Metrics endpoints: `@UseGuards(JwtAuthGuard, RoleGuard(['admin','monitoring']))`
- Admin endpoints: keep `AdminGuard`.

### 4.2 Frontend

- Admin users page:
  - `fe/src/app/admin/users/page.tsx` (role editor)
- Navigation/layout:
  - gate admin links based on `/users/me` role.

---

## 5. Test Plan

### 5.1 Backend

- E2E:
  - admin can change other user role
  - admin cannot change own role
  - monitoring can access metrics
  - monitoring denied on admin users

### 5.2 Frontend

- Unit:
  - users admin page renders role dropdown and submits patch.

---

## 6. Notes

- Ownership enforcement за teacher/author е в STORY-RBAC-2.
- Ако решим да държим roles като `varchar`, трябва поне да има strict validation в DTO/service (но prefer DB constraint).

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Created story spec for MVP roles + monitoring access + role management |
