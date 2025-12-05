# STORY-WS8-FE-LEGAL-PAGES – Privacy/GDPR и Terms страници (WS-8 реализация)

Status: Planned

_Забележка: Това WS-8 FE story реализира на практика обхвата на `STORY-WS5-FE-LEGAL-PAGES` в рамките на WS-8 и свързва Legal страниците с останалия MVP Admin/GDPR scope._

## Summary

Като **краен потребител** искам да имам **ясно достъпни страници с Terms of Use и Privacy/GDPR информация**, за да разбирам как се използват моите данни и при какви условия използвам платформата.

WS-8 гарантира, че тези страници са налични, интегрирани в навигацията (footer/header) и съгласувани с останалите GDPR/AUTH флоу-ове.

## Links to BMAD artifacts

- PRD – `docs/product/prd.md` (§4.7 FR-CROSS-LEGAL/GDPR).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§6.2 GDPR и управление на данни – Legal/Privacy страници).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-CROSS-GDPR-LEGAL).
- Conceptual Epic – `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md` (Legal story там е планирано за същия timeframe).
- WS-5 canonical story – `docs/backlog/ws-5/stories/STORY-WS5-FE-LEGAL-PAGES.md`.
- WS-8 Epic – `docs/backlog/ws-8/epics/EPIC-WS8-ADMIN-USERS-METRICS.md`.

## Acceptance Criteria (WS-8 перспектива)

- WS-8 story-то се счита успешно, когато acceptance criteria от `STORY-WS5-FE-LEGAL-PAGES` са покрити:
  - съществуват статични страници `/legal/privacy` и `/legal/terms`;
  - има видими линкове към тях (най-малко във footer на публичните страници).

## Dev Tasks (WS-8)

- [ ] Имплементиране на Next.js страници `/legal/privacy` и `/legal/terms` със съдържание според PRD.
- [ ] Добавяне на линкове към тези страници във footer (и по избор – в header/user menu).
- [ ] При нужда – i18n интеграция за Legal текстовете.
- [ ] FE тестове за наличието на страниците и линковете.

## Notes

- Parent Epic: `EPIC-WS8-ADMIN-USERS-METRICS`.
- Свързано с GDPR/Auth флоу-ове от WS-2 (delete/export, email confirmations и др.).
