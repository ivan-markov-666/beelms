# WS1 Wiki – FR-WIKI Traceability Matrix

_Роля: Analyst / Tech Lead. Цел: да свърже PRD §4.1 FR-WIKI-1…5 с WS1 епиците и Wiki user story-тата._

## 1. Обхват

- Фокус: walking skeleton **WS-1 – Guest → Wiki List → Wiki Article** от `docs/delivery/walking-skeleton.md`.
- FR-WIKI-2/3/4 се реализират частично или изцяло чрез **MVP Wiki stories**, които надграждат WS-1.

## 2. Traceability таблица (FR-WIKI ↔ Epics ↔ Stories)

| FR ID      | Кратко описание (PRD §4.1)                                      | Основни епици                                      | WS1 stories (BE/FE)                                                                                                                                                   | MVP stories / други епици                          | Забележки |
|-----------|------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------|-----------|
| FR-WIKI-1 | Публичен списък и преглед на статия без акаунт                  | EPIC-WS1-WIKI-BE, EPIC-WS1-WIKI-FE                | STORY-WS1-BE-WIKI-LIST-ENDPOINT; STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT; STORY-WS1-BE-WIKI-DB-SEED; STORY-WS1-FE-WIKI-LIST; STORY-WS1-FE-WIKI-ARTICLE; STORY-WS1-FE-WIKI-STATES | –                                                  | Напълно покрито в рамките на WS-1. |
| FR-WIKI-2 | Търсене и филтриране по език в списъка                           | EPIC-WIKI-PUBLIC (виж MCP EPIC map); базов WS1-FE | –                                                                                                                                                                     | STORY-MVP-WIKI-SEARCH-FILTER                       | Надгражда WS-1; зависи от базовия списък на `/wiki`. |
| FR-WIKI-3 | Действия „Сподели“ и „Принтирай“ на екрана за статия            | EPIC-WIKI-PUBLIC; базов WS1-FE                    | –                                                                                                                                                                     | STORY-MVP-WIKI-ARTICLE-ACTIONS                     | Надгражда STORY-WS1-FE-WIKI-ARTICLE. |
| FR-WIKI-4 | Превключване на език при налични езикови версии                  | EPIC-WIKI-PUBLIC, EPIC-CROSS-I18N; базов WS1-FE   | –                                                                                                                                                                     | STORY-MVP-WIKI-LANGUAGE-SWITCH                     | Първият WS-1 vertical може да е на фиксиран BG; това story добавя пълното поведение и е реализирано в MVP (Status: Done). |
| FR-WIKI-5 | Показване само на статии със статус `Active` в публичните екрани | EPIC-WS1-WIKI-BE, EPIC-WS1-WIKI-FE                | STORY-WS1-BE-WIKI-LIST-ENDPOINT; STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT; STORY-WS1-BE-WIKI-DB-SEED; STORY-WS1-FE-WIKI-LIST; STORY-WS1-FE-WIKI-STATES                       | STORY-MVP-WIKI-LANGUAGE-SWITCH (multi-language UX) | WS-1 гарантира Active-only; MVP stories трябва да запазят тази инварианта. |
