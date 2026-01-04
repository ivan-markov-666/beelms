---
lesson: social-credentials
title: "OAuth креденшъли и fallback логика"
objective: "Показва как админът управлява OAuth client ID/secret/redirect и как услугите ги четат."
duration: "12 мин"
---

## 1. Поток на данни

```
Admin UI  -->  PATCH /admin/settings  -->  SettingsService.updateInstanceConfig
                                          ↳ InstanceConfig.social_credentials (JSONB)
OAuth Service --> SettingsService.getEffectiveSocialProviderCredentials(provider)
                                      ↳ DB записи, иначе .env fallback
```

### Съхранявани полета per provider
- `clientId`
- `clientSecret`
- `redirectUri`

Всички са по избор (`string | null | undefined`). Trim-ваме входа; празни низове => `null`.

## 2. Admin UI поведение

1. Админът вижда чекбокси за активиране/деактивиране + статус "Configured".
2. Секция **"OAuth креденшъли"** има:
   - input за Client ID
   - input за Redirect URL
   - password поле за Client Secret (не показва текущата стойност)
   - чекбокс „Изтрий съхранения secret“
3. След "Запази" backend връща sanitized данни: `{ clientId, redirectUri, hasClientSecret }`.

## 3. Backend API (PATCH)
```json
{
  "socialCredentials": {
    "google": {
      "clientId": "123.apps.googleusercontent.com",
      "redirectUri": "https://api.example.com/auth/google/callback",
      "clientSecret": "нов_секрет"
    },
    "facebook": {
      "clientSecret": null
    }
  }
}
```
- `clientSecret` със стойност (`string`) => запис в DB
- `clientSecret: null` => изтриване
- `clientSecret` липсва => стойността остава каквато е била

## 4. Fallback към `.env`
`SettingsService.getEffectiveSocialProviderCredentials(provider)` работи така:
1. Чете DB записа. Ако има поне едно непразно поле, връща него.
2. Ако няма, проверява `.env` map:
   - Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URL`
   - Facebook: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_OAUTH_REDIRECT_URL`
   - GitHub: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_OAUTH_REDIRECT_URL`
   - LinkedIn: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_OAUTH_REDIRECT_URL`
3. Ако и двете липсват → услугата хвърля `ServiceUnavailableException` при опит за логин.

> 📌 Това позволява безболезнена миграция: първо разчитаме на env, след това админът въвежда
> новите данни от UI, без рестартиране.

## 5. OAuth услуги
Всички услуги (Google/Facebook/GitHub/LinkedIn) правят:
```ts
const creds = await settingsService.getEffectiveSocialProviderCredentials('google');
if (!creds?.clientId || !creds.clientSecret || !creds.redirectUri) {
  throw new ServiceUnavailableException('Google OAuth not configured');
}
```
След това конструират SDK клиентите с тези стойности. Методът `isConfigured()` е async и връща
`Boolean(clientId && clientSecret && redirectUri)`.

## 6. SocialLoginAvailabilityService
- При `getProviderStatuses()` вече `await`-ваме `isConfigured()`.
- Статусът „configured“ отразява реалното състояние (DB + env fallback).

## 7. Как да reset-неш secret
1. В UI: маркирай „Изтрий secret“ и запази → DB записа става `clientSecret: null`.
2. Ако няма fallback env, логинът за този provider ще бъде недостъпен, докато не въведеш нов secret.

## 8. Проверка
- `npm --prefix be run lint` гарантира, че `isConfigured()` е awaited навсякъде.
- Може да добавиш временно `console.log` в `getEffective...`, за да видиш дали четеш от DB или env.

## 9. Продължение
Следващият урок (`04-env-and-secrets.md`) описва всички env променливи, ротация и best practices
за secret management.
