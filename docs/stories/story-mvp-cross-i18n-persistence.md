# STORY-MVP-CROSS-I18N-PERSISTENCE: Persist language (cookie) + SSR lang

_BMAD Story Spec | EPIC: EPIC-CROSS-I18N | Status: ✅ Done_

---

## 1. Goal

Да се въведе персистиране на избрания език (BG/EN/DE) в cookie `ui_lang`, така че:

- при смяна на езика през global `LanguageSwitcher` да се записва cookie;
- при директен достъп до страница без `?lang=` приложението да избере езика от cookie (или default `bg`) и да добави `?lang=` в URL;
- при конфликт между URL и cookie, **URL има приоритет**.

---

## 2. Non-Goals

- Превод на всички екрани (само инфраструктура)
- Account-level персистиране в DB

---

## 3. Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | При смяна на езика `LanguageSwitcher` записва `ui_lang` cookie | ✅ |
| AC-2 | При достъп без `?lang=`, app redirect-ва към URL със `lang` от cookie/default | ✅ |
| AC-3 | При достъп с `?lang=`, cookie се синхронизира към тази стойност (URL priority) | ✅ |
| AC-4 | `<html lang>` се задава server-side според избрания език | ✅ |
| AC-5 | Има тест покритие за cookie write (LanguageSwitcher) | ✅ |

---

## 4. Implementation Notes

- Cookie име: `ui_lang`.
- Normalize логика: `normalizeLang` от `fe/src/i18n/config.ts`.
- Redirect при липсващ `lang` да пази останалите query параметри.
- Middleware да не се прилага за `_next/*`, `favicon.ico` и (по избор) `/api`.

---

## 5. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec |
