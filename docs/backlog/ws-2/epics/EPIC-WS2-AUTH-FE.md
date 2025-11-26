# EPIC-WS2-AUTH-FE – Auth UI (регистрация, вход, забравена парола, профил)

## Summary
Този epic обхваща frontend частта на walking skeleton WS-2 за **Auth & Accounts**: Next.js екрани и флоу за регистрация, вход, забравена/ресет парола и базов профил екран. Целта е да има реален end-to-end UX, който стъпва върху Auth API-то и покрива минимално, но пълно потребителско изживяване.

## Scope (какво покрива този epic)
- Next.js страници/route-ове за Auth & Profile, в рамките на WS-2 (имена примерни):
  - `/auth/register` – страница за регистрация.
  - `/auth/login` – страница за вход.
  - `/auth/forgot-password` – страница за заявка за възстановяване на парола.
  - `/auth/reset-password` – страница за ресет на парола чрез токен.
  - `/profile` – страница „Моят профил“ с основна информация и действия (изтриване/експорт на акаунт).
 - Logout действие (напр. бутон в header или в `/profile`), което изчиства локалния Auth state (JWT/сесия) и връща потребителя към публичен екран, без отделен backend logout endpoint (в синхрон с `EPIC-WS2-AUTH-BE`).
- Използване на споделен layout компонент (header/footer) и базови UI компоненти (формови елементи, съобщения за грешка/успех) според `docs/ux/qa4free-ux-design.md` и design system-а.
- Основни UX състояния за Auth екраните: loading / success / validation errors / server errors.
- Интеграция с Auth API ендпойнтите от `EPIC-WS2-AUTH-BE`.
- UI интеграция на anti-bot механизми (напр. reCAPTCHA widget или еквивалент) за критични форми (регистрация, заявка за забравена парола, експорт на данни), в синхрон с `EPIC-WS2-AUTH-BE`, PRD §4.2 (FR-AUTH-7) и `EPIC-CROSS-SECURITY`.

Този epic **не** покрива (out of scope):
- Пълен Account Settings център с напреднали настройки (notification prefs, multi-factor и др.).
- Административни екрани за управление на потребители (част от Admin Portal).
- Пълна мултиезичност на всички Auth екрани (извън базовия BG вариант за WS-2); това се реализира поетапно чрез `EPIC-CROSS-I18N`.
- Пълна responsive/visual polish отвъд нуждите за WS-2 (допълнителни анимации, сложни form wizards и др.).

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (§5.1–5.2 – функционалности за акаунти в MVP).
- PRD – `docs/product/prd.md` (§4.2 FR-AUTH-1..7, §4.7 FR-CROSS-2, FR-CROSS-4).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§2.1–2.4 – Auth екрани).
- UX Design – `docs/ux/qa4free-ux-design.md` (екрани за регистрация, вход, профил, забравена/ресет парола).
- User Flows – `docs/ux/flows/qa4free-user-flows.md` (flows за register/login/forgot/reset/profile/GDPR flows).
- System Architecture – `docs/architecture/system-architecture.md` (frontend приложение, навигация, security/UX ограничения).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-AUTH-ACCOUNTS, EPIC-CROSS-I18N, EPIC-CROSS-GDPR-LEGAL, EPIC-CROSS-SECURITY).

## Child user stories
- [ ] STORY-WS2-FE-AUTH-REGISTER-LOGIN – UI за регистрация и вход.
- [ ] STORY-WS2-FE-AUTH-FORGOT-RESET – UI за забравена и ресет парола.
- [ ] STORY-WS2-FE-AUTH-PROFILE-ACCOUNT – UI за профил, изтриване и експорт на акаунт.

## Risks / Assumptions
- **Risks:**
  - Ако Auth API-то (WS-2 BE) закъснее или спецификацията му се промени, това блокира или връща назад FE имплементацията.
  - Неконсистентни UX съобщения (напр. грешки, валидации) могат да объркат потребителя при критични операции (reset, delete account).
- **Assumptions:**
  - UX дизайнът за Auth екраните е достатъчно стабилен за WS-2 и няма да търпи фундаментални промени в рамките на спринта.
  - Има базов design system (inputs, buttons, alerts), който може да се използва без съществени блокери.
  - Временно, в dev среда могат да се използват mock-ове за имейл линкове (напр. показване на reset линка в UI), стига DoD да изисква реална интеграция поне в една среда.

## Definition of Done (Epic)
- Всички child stories по-горе са изпълнени и затворени.
- Съществуват работещи страници за register/login/forgot/reset/profile, достъпни през основния frontend.
- UX поведението на екраните съответства на релевантните UX/flows и PRD изисквания за Auth.
- Всички форми имат базова клиентска и сървърна валидация, с ясни съобщения за грешка.
- Потокът за закриване на акаунт реализира двустепенно потвърждение, а заявките за експорт на данни и забравена парола включват нужните anti-bot проверки (напр. CAPTCHA), в синхрон с PRD §4.2 и MVP feature list §2.3–2.4.
- Реализирана е end-to-end интеграция с Auth API ендпойнтите от `EPIC-WS2-AUTH-BE` (без да се разчита на mock данни в основния flow).
- Налични са поне базови FE/интеграционни тестове или ясен мануален чеклист за основните Auth сценарии.
- Няма отворени критични (P0/P1) дефекти, свързани с Auth UX за WS-2.
