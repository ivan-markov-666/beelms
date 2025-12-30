# STORY-SETTINGS-3: Admin Legal Content Editor (Terms/Privacy)

_BMAD Story Spec | EPIC: EPIC-CORE-INSTANCE-SETTINGS | Status: ✅ Implemented_

---

## 1. Goal

Администраторът може да **редактира съдържанието** на legal страниците през admin UI (както е в Product Brief), вместо те да са само статични FE страници.

MVP scope:

- Terms and Conditions
- Privacy / GDPR

---

## 2. Non-Goals

- Комплексно versioning на legal documents (termsVersion/privacyVersion)
- Granular consent management (marketing consents)
- Многоюрисдикционни пакети от legal текстове

---

## 3. Acceptance Criteria

### 3.1 Backend: Legal content storage

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има таблица/Entity за legal pages (напр. `legal_pages`) със `slug` + `title` + `contentMarkdown` + `updatedAt` | ✅ |
| AC-2 | Има migration за legal pages | ✅ |
| AC-3 | Има seed за default Terms/Privacy (placeholder content) | ✅ |

### 3.2 Backend: Public legal endpoints

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | `GET /api/legal/terms` връща текущото Terms съдържание | ✅ |
| AC-5 | `GET /api/legal/privacy` връща текущото Privacy съдържание | ✅ |
| AC-6 | Ако `features.gdprLegal=false`, legal endpoints са disabled (consistency с STORY-SETTINGS-2) | ✅ |

### 3.3 Backend: Admin endpoints

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | `GET /api/admin/legal/pages` връща списък (terms/privacy) | ✅ |
| AC-8 | `PUT /api/admin/legal/pages/:slug` обновява съдържание (markdown) | ✅ |
| AC-9 | Само admin има достъп | ✅ |

### 3.4 Frontend

| # | Criterion | Status |
|---|-----------|--------|
| AC-10 | Публичните `/legal/terms` и `/legal/privacy` страници рендерират съдържанието от API (SSR/ISR) | ✅ |
| AC-11 | Admin UI `/admin/legal` позволява edit + preview на markdown | ✅ |
| AC-12 | Има success/error states; при save няма refresh issues | ✅ |

---

## 4. Technical Implementation (Where)

### 4.1 Backend

- Entity:
  - `be/src/legal/legal-page.entity.ts`
- Module:
  - `be/src/legal/legal.module.ts`
- Controllers:
  - `be/src/legal/legal.controller.ts`
    - `GET /legal/terms`
    - `GET /legal/privacy`
  - `be/src/legal/admin-legal.controller.ts`
    - `GET /admin/legal/pages`
    - `PUT /admin/legal/pages/:slug`
- DTOs:
  - `AdminUpdateLegalPageDto` (`title?`, `contentMarkdown`)

### 4.2 Frontend

- Public pages:
  - update existing:
    - `fe/src/app/legal/terms/page.tsx`
    - `fe/src/app/legal/privacy/page.tsx`
  - to fetch from API and render markdown consistently with wiki renderer.
- Admin page:
  - `fe/src/app/admin/legal/page.tsx`

---

## 5. Test Plan

### 5.1 Backend

- E2E:
  - admin updates terms → public GET reflects change.
  - gdprLegal disabled → legal endpoints blocked.

### 5.2 Frontend

- Unit: public legal pages render server response.
- Unit: admin legal editor submits update.

---

## 6. Notes

- Това story **не** променя consent логиката при регистрация. Consent остава задължителен (STORY-LEGAL-2), а съдържанието идва от админ редактор.
- Ако искаме minimum friction: `title` може да е hardcoded, а в DB да се пази само `contentMarkdown`.

---

## 7. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-29 | Cascade | Created story spec for admin-managed legal content |
