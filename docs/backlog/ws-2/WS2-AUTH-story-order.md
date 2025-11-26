# WS2 Auth – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-2 Auth & Accounts walking skeleton + свързани MVP разширения в същия timeframe (Wiki actions, Cross i18n foundation)._ 

## 1. Обхват

Тази последователност покрива:
- WS-2 Auth BE/FE stories (walking skeleton WS-2 от `docs/delivery/walking-skeleton.md`).
- Свързани MVP stories, планирани за изпълнение в същия timeframe (Wiki article actions, Cross-cutting i18n foundation).

## 2. Препоръчителен ред за имплементация

### WS-2 – Auth & Accounts walking skeleton (BE → FE)

1. **STORY-WS2-BE-AUTH-REGISTER-LOGIN**  
   Backend ендпойнти за регистрация и вход (`POST /api/auth/register`, `POST /api/auth/login`) с bcryptjs hashing, JWT издаване и базова anti-bot защита.

2. **STORY-WS2-FE-AUTH-REGISTER-LOGIN**  
   FE екрани `/register` и `/login`, които използват Auth API от story 1 и реализират базовия UI flow за регистрация и вход.

3. **STORY-WS2-BE-AUTH-FORGOT-RESET**  
   Backend flow за забравена парола (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`), токени, валидации и security поведение.

4. **STORY-WS2-FE-AUTH-FORGOT-RESET**  
   FE екрани за заявка/ресет на парола, стъпващи върху BE API от story 3.

5. **STORY-WS2-BE-AUTH-PROFILE-ACCOUNT**  
   Backend endpoints за профил и акаунт (`GET /api/users/me`, `DELETE /api/users/me`, `POST /api/users/me/export`) с guard-ване по JWT.

6. **STORY-WS2-FE-AUTH-PROFILE-ACCOUNT**  
   FE страница `/profile` (преглед на профил), действия „Delete account“ и „Export my data“, стъпващи на BE API от story 5.

### Свързани MVP разширения (в същия timeframe, извън WS-2 Auth skeleton)

7. **STORY-MVP-WIKI-ARTICLE-ACTIONS**  
   Действия „Сподели“ и „Принтирай“ върху `/wiki/[slug]` (EPIC-WIKI-PUBLIC) – UX polish за Wiki статията, стъпващо върху вече реализирания WS-1 Wiki vertical.

8. **STORY-MVP-CROSS-I18N-FE-FOUNDATION**  
   FE i18n foundation (EPIC-CROSS-I18N) – централен i18n конфиг, речници и преводими layout/nav елементи, стъпващ върху глобалния `LanguageSwitcher` от `STORY-MVP-WIKI-LANGUAGE-SWITCH`.

---

## 3. Бележки

- WS-2 walking skeleton (stories 1–6) покрива основните FR-AUTH-1…7 от PRD §4.2 според `WS2-AUTH-traceability.md`.
- Stories 7–8 не са част от Auth skeleton, но са логично планирани в същия MVP timeframe:
  - `STORY-MVP-WIKI-ARTICLE-ACTIONS` завършва FR-WIKI-3 (Share/Print) за публичната Wiki;
  - `STORY-MVP-CROSS-I18N-FE-FOUNDATION` е първият vertical от `EPIC-CROSS-I18N` и позволява Auth/Practice UI да се възползват от глобалния езиков избор.
- За WS-1 Wiki виж `docs/backlog/ws-1/WS1-WIKI-story-order.md` – там `STORY-MVP-WIKI-ARTICLE-ACTIONS` и Cross i18n foundation са отбелязани като MVP разширения, планирани за изпълнение след формалното приключване на WS-1 и в координация с WS-2.
