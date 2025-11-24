# WS2 Auth – FR-AUTH Traceability Matrix

_Роля: Analyst / Tech Lead. Цел: да свърже PRD §4.2 FR-AUTH-1…7 с WS2 Auth епиците и user story-тата._

## 1. Обхват

- Фокус: walking skeleton **WS-2 – Auth & Accounts skeleton** от `docs/delivery/walking-skeleton.md`.
- Покрива BE/FE епиците за Auth (`EPIC-WS2-AUTH-BE`, `EPIC-WS2-AUTH-FE`) и техните child stories.

## 2. Traceability таблица (FR-AUTH ↔ Epics ↔ Stories)

| FR ID       | Кратко описание (PRD §4.2)                                                      | Основни епици                                      | WS2 stories (BE/FE)                                                                                                                                             | Забележки |
|------------|----------------------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| FR-AUTH-1  | Регистрация с имейл и парола                                                    | EPIC-WS2-AUTH-BE, EPIC-WS2-AUTH-FE                | STORY-WS2-BE-AUTH-REGISTER-LOGIN; STORY-WS2-FE-AUTH-REGISTER-LOGIN                                                                                              | Napълно покрито в рамките на WS-2. |
| FR-AUTH-2  | Вход с имейл и парола, издаване на JWT                                          | EPIC-WS2-AUTH-BE, EPIC-WS2-AUTH-FE                | STORY-WS2-BE-AUTH-REGISTER-LOGIN; STORY-WS2-FE-AUTH-REGISTER-LOGIN                                                                                              | Guard-ване на защитени екрани (напр. `/profile`) e в STORY-WS2-FE-AUTH-PROFILE-ACCOUNT. |
| FR-AUTH-3  | Забравена парола – заявка и ресет чрез токен                                    | EPIC-WS2-AUTH-BE, EPIC-WS2-AUTH-FE                | STORY-WS2-BE-AUTH-FORGOT-RESET; STORY-WS2-FE-AUTH-FORGOT-RESET                                                                                                  | Token lifetime ~24 часа и поведението при изтекъл токен са описани в BE story-то. |
| FR-AUTH-4  | Преглед на основна профилна информация                                         | EPIC-WS2-AUTH-BE, EPIC-WS2-AUTH-FE                | STORY-WS2-BE-AUTH-PROFILE-ACCOUNT (`GET /api/users/me`); STORY-WS2-FE-AUTH-PROFILE-ACCOUNT (`/profile`)                                                        | Свързано с GDPR и ролята на регистриран потребител. |
| FR-AUTH-5  | Закриване/изтриване на акаунта (right to be forgotten, двустепенно потвърждение) | EPIC-WS2-AUTH-BE, EPIC-WS2-AUTH-FE                | STORY-WS2-BE-AUTH-PROFILE-ACCOUNT (`DELETE /api/users/me`); STORY-WS2-FE-AUTH-PROFILE-ACCOUNT (двустепенно UI потвърждение и logout flow)                      | BE story-то гарантира унищожаване/анонимизиране; FE story-то гарантира UX за двойно потвърждение. |
| FR-AUTH-6  | Експорт на лични данни                                                          | EPIC-WS2-AUTH-BE, EPIC-WS2-AUTH-FE                | STORY-WS2-BE-AUTH-PROFILE-ACCOUNT (`POST /api/users/me/export`); STORY-WS2-FE-AUTH-PROFILE-ACCOUNT (UI действие „Export my data“)                               | Форматът на експорта е минимален, но съвместим с GDPR (описан в BE Notes). |
| FR-AUTH-7  | Anti-bot защита (CAPTCHA/reCAPTCHA) за критични операции                        | EPIC-WS2-AUTH-BE, EPIC-WS2-AUTH-FE, EPIC-CROSS-SECURITY | STORY-WS2-BE-AUTH-REGISTER-LOGIN; STORY-WS2-BE-AUTH-FORGOT-RESET; STORY-WS2-BE-AUTH-PROFILE-ACCOUNT; STORY-WS2-FE-AUTH-REGISTER-LOGIN; STORY-WS2-FE-AUTH-FORGOT-RESET; STORY-WS2-FE-AUTH-PROFILE-ACCOUNT | Anti-bot е описан в acceptance criteria и Dev Tasks; детайлната реализация (конкретен доставчик) се доуточнява на ниво архитектура/конфигурация. |
