# STORY-WS5-FE-LEGAL-PAGES – Privacy/GDPR и Terms страници

Status: Planned

## Summary
Като **краен потребител** искам да имам **ясно достъпни страници с Terms of Use и Privacy/GDPR информация**, за да разбирам как се използват моите данни и при какви условия използвам платформата.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (§4.7 FR-CROSS-LEGAL/GDPR).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Legal/Privacy страници).
- System Architecture – `docs/architecture/system-architecture.md` (Legal/Compliance overview).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-CROSS-GDPR-LEGAL).

## Acceptance Criteria
- Съществуват статични страници:
  - `/legal/privacy` – Privacy/GDPR информация;
  - `/legal/terms` – Terms of Use.
- Има видими линкове към тези страници:
  - най-малко във footer на публичните страници;
  - по избор – в header/user menu.
- Съдържанието на страниците отразява описаното в PRD/MVP за обработка на лични данни (дори и на ниво минимален, но коректен текст).
- Страниците са включени в навигационните UX flow-ове и са покрити от basic FE тест (рендер на основните заглавия).

## Dev Tasks
- [ ] Дефиниране на Next.js страници `/legal/privacy` и `/legal/terms` със статично съдържание.
- [ ] Добавяне на линкове във footer (и/или header) на публичния layout.
- [ ] По желание – базов i18n (en/bg) за заглавията и ключови секции.
- [ ] FE тестове за рендер на заглавията и наличието на линкове във footer.
