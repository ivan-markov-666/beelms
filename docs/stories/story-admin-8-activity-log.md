# STORY-ADMIN-8: Admin Activity Log (Wiki + Users)

_BMAD Story Spec | EPIC: EPIC-CORE-ADMIN | Status: ✅ Implemented_

---

## 1. Goal

Да предостави отделна admin страница за **activity log** (audit-lite) на ключови събития:

- Wiki: създаване/обновяване на статии (версии)
- Users: регистрация и деактивиране

Целта е troubleshooting и basic visibility в админ панела.

---

## 2. Non-Goals

- Пълен audit trail (вкл. кой точно е променил user status, diff на всички entities и т.н.)
- Server-side filtering/pagination (UI филтрите са client-side)
- RBAC по роли извън admin

---

## 3. Acceptance Criteria

### 3.1 Admin API

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `GET /api/admin/activity` връща списък от activity items, сортирани по `occurredAt` desc | ✅ |
| AC-2 | Item включва: `occurredAt`, `type` ∈ {wiki,user}, `action` ∈ {article_created,article_updated,user_registered,user_deactivated}, `entityId`, `entityLabel`, `actorLabel` | ✅ |
| AC-3 | Endpoint изисква JWT + admin (`JwtAuthGuard` + `AdminGuard`) | ✅ |
| AC-4 | Payload е hard-capped (за да не става прекалено голям) | ✅ |

### 3.2 Admin UI

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | `/admin/activity` показва activity log таблица с филтри: type/action, search и period preset/custom | ✅ |
| AC-6 | UI има loading/error/empty states | ✅ |
| AC-7 | UI поддържа CSV export на текущо филтрираните резултати (client-side) | ✅ |
| AC-8 | По подразбиране UI показва ограничен брой записи (за UX), но без да чупи export-а | ✅ |

---

## 4. Technical Implementation (Where)

### Backend

- Controller: `be/src/auth/admin-activity.controller.ts` (`GET /admin/activity`)
- Service: `be/src/auth/admin-activity.service.ts`
- DTO: `be/src/auth/dto/admin-activity-item.dto.ts`
- Sources:
  - Users: `User` (createdAt + active/updatedAt)
  - Wiki: `WikiArticleVersion` + `createdByUserId` (email map)

### Frontend

- Page: `fe/src/app/admin/activity/page.tsx`
- Entry points/links:
  - `fe/src/app/admin/_components/admin-home-content.tsx`
- i18n:
  - `fe/src/i18n/messages.ts`

---

## 5. Notes

- Date range филтрите са **client-side** (няма query params към backend).
- `actorLabel` за user events е `null` (няма актьор), а за wiki events е email (ако има `createdByUserId`).
