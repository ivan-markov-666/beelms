# STORY-LEGAL-1: Public legal pages (Terms, Privacy, Contact)

_BMAD Story Spec | EPIC: EPIC-CORE-CROSS-GDPR-LEGAL | Status: ✅ Implemented_

---

## 1. Goal

Да предоставим публични страници, достъпни от footer-а на BeeLMS, които покриват задължителните правни изисквания за MVP:
- Terms of Service (Общи условия)
- Privacy Policy (Политика за поверителност)
- About/Contact страница с информация за контакт и подкрепа

Страниците са многоезични (BG/EN) и се кешират публично.

---

## 2. Non-Goals

- Cookie consent банер (post-MVP)
- Dynamic CMS таблица за legal текстовете.
- Localized PDF export

---

## 3. Acceptance Criteria

### 3.1 Content & Routing

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Публични маршрути `/legal/terms`, `/legal/privacy`, `/about`, `/contact` са достъпни без акаунт | ✅ |
| AC-2 | Съдържанието е имплементирано като статичен текст в страниците `fe/src/app/legal/*/page.tsx` (BG/EN варианти) | ✅ |
| AC-3 | Езикът се определя от i18n middleware (cookie + URL query `?lang=`), с fallback към BG | ✅ |
| AC-4 | Footer линковете са налични на всяка публична страница (About / Privacy / Contact) | ✅ |

### 3.2 SEO & Metadata

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | Страниците имат преводими headings (H1/intro) (MVP) | ✅ |

### 3.3 Content Authoring Flow

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | Legal съдържанието е версионирано в Git; промяната се прави чрез PR review | ✅ |
| AC-8 | Съдържанието покрива базовите нужди (параграфи + списъци) и се поддържа чрез промени в страниците | ✅ |

---

## 4. Technical Implementation (Where)

### Frontend
- Pages:
  - `fe/src/app/legal/terms/page.tsx`
  - `fe/src/app/legal/privacy/page.tsx`
  - `fe/src/app/about/page.tsx`
  - `fe/src/app/contact/page.tsx`
- Footer links: `fe/src/app/_components/site-footer.tsx`

### Backend (optional references)
- Няма BE промени; това е чисто FE статично съдържание.

### Tests
- N/A (няма отделни snapshot/unit тестове само за legal страниците).

---

## 5. Notes
- Terms route съществува (`/legal/terms`), но не е включен като линк във footer-а (към момента).
