# STORY-WS2-FE-AUTH-REGISTER-LOGIN – UI за регистрация и вход

Status: Draft

## Summary
Като **нов или връщащ се потребител** искам да имам **ясни и лесни за ползване екрани за регистрация и вход**, за да мога бързо да създам акаунт или да вляза в съществуващ такъв.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (§4.2 FR-AUTH-1, FR-AUTH-2, FR-AUTH-7).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§2.1 Регистрация, §2.2 Вход/Изход).
- UX Design – `docs/ux/qa4free-ux-design.md` (Auth екрани за register/login).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (flows за регистрация и вход).
- System Architecture – `docs/architecture/system-architecture.md` (frontend приложение, навигация, сигурност).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-AUTH-ACCOUNTS, EPIC-CROSS-I18N, EPIC-CROSS-SECURITY).

## Acceptance Criteria
- Страница `/auth/register`:
  - Показва форма с полета за имейл и парола (и други полета според PRD/UX, ако има такива).
  - Има линк/чекбокс за съгласие с Terms of Use / Privacy (ако UX го изисква още на този екран).
  - Включва anti-bot елемент (напр. reCAPTCHA), в синхрон с PRD/MVP и `EPIC-WS2-AUTH-BE`.
  - Има client-side валидация (формат на имейл, минимална дължина на парола и др.).
  - При успешно изпращане:
    - се извиква `POST /api/auth/register` и при success потребителят получава ясно съобщение (и евентуално се пренасочва към login или директно влиза, според UX).
  - При грешка (валидация/duplicate email/server error) се показват ясни, но неразкриващи чувствителна информация съобщения.
- Страница `/auth/login`:
  - Показва форма за имейл и парола.
  - Има link към „Забравена парола“ (`/auth/forgot-password`).
  - При успешно логване през `POST /api/auth/login` потребителят се счита за вписан (JWT/сесия) и се пренасочва към подходяща landing страница (напр. Wiki списък или dashboard).
  - При неуспешен вход се показва общо съобщение („Невалидни данни за вход“), без да се уточнява кое поле е грешно.
- Общи UX изисквания:
  - И двата екрана използват общ layout и базови UI компоненти от design system-а.
  - Съобщенията за грешка и успех са на правилния език и отговарят на tone-of-voice на продукта.

## Dev Tasks
- [ ] Имплементиране на страница `/auth/register` с форма, client-side валидация и интеграция с `POST /api/auth/register`.
- [ ] Имплементиране на страница `/auth/login` с форма, client-side валидация и интеграция с `POST /api/auth/login`.
- [ ] Управление на Auth състояние на клиента (запазване/изтриване на токени, basic guard за защитени страници, ако е в обхвата на WS-2).
- [ ] Интеграция на anti-bot механизъм (напр. reCAPTCHA) в регистрационната форма, в синхрон с BE и security изискванията.
- [ ] Използване на базови UI компоненти (inputs, buttons, error messages) от design system-а.
- [ ] Ръчно тестване на основните сценарии (успешна регистрация, неуспешна регистрация, успешен/неуспешен login).
- [ ] (по избор) FE тестове за рендване и поведение на формите.

## Notes
- Тази story е тясно свързана със `STORY-WS2-BE-AUTH-REGISTER-LOGIN` и трябва да следи нейния API contract (body, отговори, кодове).
- Добре е да се планира как ще се държи UI-то при забавен отговор на сървъра (loading state), макар детайлните състояния да могат да бъдат изнесени в отделно story при нужда.
- В бъдещи WS може да се добавят допълнителни удобства (запазване на имейл, „remember me“, визуални индикатори за сила на паролата и др.), но за WS-2 целта е минимален, но използваем флоу.
