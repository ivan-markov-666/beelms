---
lesson: register-page
title: "Register страница и админ конфигурация"
objective: "Документира функционалността на /auth/register и как админът контролира поведението."
duration: "15 мин"
---

## 1. User journey
- URL: `/auth/register`
- Компоненти: `fe/src/app/auth/register/page.tsx` → `RegisterContent`.
- Логика: клиентска форма + екрани за социален логин; при успех автоматично пренасочва към `/auth/login` след 13s.

### Формата съдържа
1. Имейл – required, basic regex проверка, показва inline грешки.
2. Парола + Confirm – правила: ≥ 8 символа, поне 1 главна, 1 малка, 1 цифра, 1 специален; показва strength meter.
3. Terms checkbox – задължителен; води към `/legal/terms` и `/legal/privacy`.
4. reCAPTCHA – визуализира се само ако фронтендът знае `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
5. Honeypot поле – скрит текст input против ботове.

### Client-side UX
- Live validation (почиства грешки при нов input).
- Form persistence в `localStorage` ключ `register-form-data` (email, пароли, terms).
- Ако има активен session (`/users/me` с валиден token) → redirect към `/`.

## 2. Backend API
`POST /auth/register`
- Тяло: `{ email, password, acceptTerms, captchaToken? }`.
- Response 201 върха user snapshot; FE показва success съобщение и reset-ва полетата.
- 409 → „Този имейл вече е регистриран.“; 400 → invalid data; друго → generic.

### reCAPTCHA & Captcha flags
| Компонент | Env / настройка | Поведение |
| --- | --- | --- |
| Frontend | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Ако е дефиниран → показва реалния widget чрез `RecaptchaWidget`. |
| Backend | `AUTH_REQUIRE_CAPTCHA` (`true/false`) | Ако е `true`, service изисква валиден `captchaToken`, иначе хвърля 400. |
| Backend | `ACCOUNT_EXPORT_REQUIRE_CAPTCHA` | Отделен флаг за account export (не влияе на register). |

> Ако искаш да тестваш без captcha, остави `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` празен и включи dev bypass в widget-a (има диалог при load error).

## 3. Социални регистрации
- Поддържани доставчици: Google, Facebook, GitHub, LinkedIn.
- Бутони се показват само ако в публичните настройки `features.social{Provider}` e `true`.
- `usePublicSettings()` зарежда `/public/settings` и кешира флаговете.
- Всяко начало на OAuth:
  ```ts
  await startSocialOAuth({ provider, redirectPath: searchParams.get("redirect") });
  ```
- Ошибки от authorize се показват чрез `SOCIAL_ERROR_KEYS_REGISTER` (disabled / unavailable / generic).

## 4. Какво контролира админът
Админ UI: `/admin/settings` → секция **Feature flags** + **OAuth креденшъли**.

### Feature flags (impact върху Register)
| Flag | Ключ | Ефект |
| --- | --- | --- |
| Auth | `features.auth` | Ако е false, целият register/login flow се изключва (SPA показва предупреждение). |
| Social Google/Facebook/GitHub/LinkedIn | `features.social*` | Скриват съответните бутони и връщат статус „Социалните регистрации са изключени“. |
| GDPR/Legal | `features.gdprLegal` | Контролира Terms/Privacy линковете (ако е изключено, UI може да ги скрие). |

### OAuth креденшъли
- Формата позволява въвеждане на Client ID, Redirect URL и Secret на provider.
- Secret не се показва; може само да се замени или изтрие.
- След `PATCH /admin/settings` backend връща sanitized данни `{ clientId, redirectUri, hasClientSecret }` за UI.
- Статус „configured“ използва `SettingsService.getEffectiveSocialProviderCredentials` (DB > env fallback). Ако не е конфигурирано, FE показва `register{Provider}Unavailable` messsage при опит за OAuth.

## 5. Как да опишеш Register page в обучителния курс
1. Импортирай този файл като Wiki статия „Register page“. 
2. Добави Lesson в курса „BeeLMS System Intro“ → тип „Reading“ с линк към статията.
3. В задачата към урока добави checklist:
   - Потвърди, че Terms линковете работят.
   - Валидирай парола, която нарушава всяко правило.
   - Провери, че CAPTCHA се появява при зададен site key.
   - Деактивирай един social provider от админ панела и виж промяната на UI.

## 6. Тестове
- `fe/src/app/auth/__tests__/register-page.test.tsx` покрива: валидации, captcha изискване, duplicate email, terms toggle, social fallback.
- За backend виж `be/src/auth/auth.service.spec.ts` и `be/test/auth.e2e-spec.ts` (captcha + register cases).

## 7. Чести сценарии
1. **Admin иска временно да изключи Google login** → `features.socialGoogle = false` → бутонът се скрива; пробите през UI показват „Регистрацията с Google е временно изключена“.
2. **Ново конфигуриране на LinkedIn** → въвеждаш Client ID/Secret/Redirect → статусът става `configured: true`, бутонът работи без рестарт.
3. **Captcha rollout** → задаваш `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `AUTH_REQUIRE_CAPTCHA=true` → FE показва widget, BE изисква token.

---
Следващите уроци ще бъдат добавени, когато останалите страници са готови. За момента курсът покрива само Register page-а и неговата конфигурация.
