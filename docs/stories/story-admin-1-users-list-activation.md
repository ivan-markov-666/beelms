# STORY-ADMIN-1: Admin Users list + activate/deactivate

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Осигуряване на минимален admin инструмент за поддръжката на потребители в BeeLMS:
- виждане на списък с всички акаунти (активни/неактивни);
- принудително активиране/деактивиране от admin;
- търсене/филтриране по имейл.

---

## 2. Non-Goals

- CRUD върху роли (има само default роли: user/admin)
- Ресет на пароли (covered by auth flows)
- Импорт/експорт на users списък

---

## 3. Acceptance Criteria

### 3.1 Admin API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/users?q=&status=&role=&page=&pageSize=` връща списък с потребители (id, email, role, active, createdAt) | ✅ |
| AC-2 | `PATCH /api/admin/users/:id` обновява `active` чрез body `{ active: boolean }` | ✅ |
| AC-3 | `GET /api/admin/users/stats` връща basic counters (totalUsers/activeUsers/deactivatedUsers/adminUsers) | ✅ |
| AC-4 | Всички admin user endpoints изискват валидна JWT + admin role | ✅ |

### 3.2 Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | Admin панелът има секция „Users“ със списък (таблица) и search поле | ✅ |
| AC-7 | Колоните включват email, статус badge, дата на регистрация и role | ✅ |
| AC-8 | Действия: Activate/Deactivate бутон (с confirm modal) | ✅ |
| AC-9 | UI отразява резултата без reload (optimistic update) | ✅ |

### 3.3 Security & Logging

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Non-admin JWT → 403; липсващ токен → 401 | ✅ |

---

## 4. Technical Implementation (Where)

### Backend
- Controller: `be/src/auth/admin-users.controller.ts`
- Service: `be/src/auth/admin-users.service.ts`
- Guards: `JwtAuthGuard` + `AdminGuard`
- DTOs: `be/src/auth/dto/admin-update-user.dto.ts`

### Frontend
- Page: `fe/src/app/admin/users/page.tsx`
- Страницата е self-contained и вика Admin API директно чрез `fetch`.

### Tests
- BE e2e: `be/test/admin-users.e2e-spec.ts`
- FE unit: `fe/src/app/admin/users/__tests__/admin-users-page.test.tsx`

---

## 5. Notes
- Деактивираните акаунти не могат да се логнат (AuthService проверява `user.active`).
