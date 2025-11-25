# STORY-WS2-FE-AUTH-FORGOT-RESET – UI за забравена и ресет парола

Status: Draft

## Summary
Като **регистриран потребител, който е забравил паролата си**, искам да имам **ясен флоу за заявка и ресет на паролата**, за да възстановя достъпа до акаунта си.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (§4.2 FR-AUTH-3, FR-AUTH-7).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§2.3 Забравена парола).
- UX Design – `docs/ux/qa4free-ux-design.md` (екрани за forgot/reset password).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (forgot/reset flow).
- System Architecture – `docs/architecture/system-architecture.md` (Auth, имейл услуга, security).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-AUTH-ACCOUNTS, EPIC-CROSS-SECURITY).

## Acceptance Criteria
- Страница `/auth/forgot-password`:
  - Показва форма за въвеждане на имейл адрес.
  - Включва anti-bot елемент (напр. reCAPTCHA), в синхрон с PRD.
  - При изпращане се вика `POST /api/auth/forgot-password`.
  - UI показва общо съобщение за успех („Ако има акаунт с този имейл, ще изпратим инструкции…“), независимо дали има реален акаунт.
- Страница `/auth/reset-password`:
  - Достъпва се чрез линк с токен (напр. query или path параметър), получен по имейл.
  - Показва форма за нова парола (и потвърждение, ако UX го изисква).
  - При изпращане се вика `POST /api/auth/reset-password` с токен и нова парола.
  - При успех UI показва съобщение и/или пренасочва към `/auth/login`.
  - При изтекъл/невалиден токен UI показва подходящо съобщение и предлага да се подаде нова forgot заявка.
- Общи UX изисквания:
  - И двата екрана използват споделен layout и базови UI компоненти.
  - Съобщенията са на правилния език и съответстват на PRD/UX tone-of-voice.

## Dev Tasks
- [ ] Имплементиране на страница `/auth/forgot-password` с форма, reCAPTCHA и интеграция с `POST /api/auth/forgot-password`.
- [ ] Имплементиране на страница `/auth/reset-password` с форма за нова парола и интеграция с `POST /api/auth/reset-password`.
- [ ] Обработка на различни състояния (успех, изтекъл токен, обща грешка) според UX/flows.
- [ ] Ръчно тестване на целия forgot/reset флоу в комбинация с BE API.
- [ ] (по избор) FE тестове за основните сценарии и състояния.

## Notes
- Тази story стъпва директно върху `STORY-WS2-BE-AUTH-FORGOT-RESET` и трябва да следи неговия API contract.
- В dev среда линкът може да се „симулира“ (напр. да се показва в UI) докато не се включи реална имейл услуга, но за production флоу се очаква реален имейл.
- Важно е съобщенията да не издават дали даден имейл съществува в системата.
