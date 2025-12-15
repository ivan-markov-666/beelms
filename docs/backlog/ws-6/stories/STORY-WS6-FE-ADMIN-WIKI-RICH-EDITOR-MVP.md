# STORY-WS6-FE-ADMIN-WIKI-RICH-EDITOR-MVP – Rich editor (TipTap) + Markdown toggle + Tables + Mermaid code blocks

Status: Done

## Summary
Като **администратор**, искам да редактирам Wiki съдържанието в **Rich text режим** (WYSIWYG) с възможност за **превключване към Markdown**, така че да мога да работя по-удобно с текст, таблици и Mermaid диаграми, без да нарушавам текущото съхранение на съдържанието като Markdown.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.1 (FR-WIKI) и §4.6 (FR-ADMIN-1..2 – Admin Wiki управление).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §5.1–5.2 (Admin Wiki съдържание и версии).
- System Architecture – `docs/architecture/system-architecture.md` (Wiki rendering, Admin Portal).
- WS-6 epic – `docs/backlog/ws-6/epics/EPIC-WS6-ADMIN-WIKI-EDIT-VERSIONS.md`.

## Acceptance Criteria
- Admin Wiki edit страницата има toggle **Markdown / Rich text** за полето "Съдържание".
- Rich режимът:
  - позволява редакция на текст (P/H1–H4, bold/italic, списъци);
  - поддържа таблици (insert / add/remove rows/cols / basic merge UX);
  - поддържа Mermaid като **code block** (fenced code block с език `mermaid`), без inline render в Rich режима.
- Превключване Rich → Markdown:
  - сериализира текущото Rich съдържание към Markdown и го показва в textarea.
- Превключване Markdown → Rich:
  - зарежда текущия Markdown в Rich редактора.
- Save и autosave изпращат към BE **Markdown** съдържание.
- В preview и публичната wiki:
  - Mermaid блоковете се рендерват като диаграми;
  - налични са zoom/fullscreen/print контроли за Mermaid диаграми.
- Има unit тестове за критичните Mermaid части (sanitization + UI) и FE Jest suite минава на Windows.

## Dev Tasks
- [x] Добавяне на Rich editor компонент (TipTap) за Admin Wiki edit.
- [x] Имплементация на двупосочен toggle Markdown/Rich за "Съдържание".
- [x] Имплементация на markdown ↔ HTML конверсия (best-effort) за Rich режима.
- [x] Поддръжка на таблици в Rich режима.
- [x] Поддръжка на Mermaid като code block в Rich режима.
- [x] Обновяване на preview/public rendering за Mermaid (zoom/fullscreen/print) + SVG sanitization.
- [x] Добавяне/поправка на unit тестове за Mermaid и Jest конфигурация за ESM зависимости на Windows.
- [x] Smoke test на реалния flow: create/edit/toggle/save/autosave + tables + mermaid.

## Notes
- Rich редакторът е "best-effort" спрямо Markdown конверсията; canonical форматът за съхранение остава Markdown.
- Mermaid е дефиниран като fenced code block с език `mermaid` и се рендерва в preview/public wiki, а не inline в Rich режима.
