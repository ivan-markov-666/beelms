---
lesson: instance-config
title: "InstanceConfig и admin settings"
objective: "Как съхраняваме глобалните настройки и как admin UI ги обновява."
duration: "10 мин"
---

## 1. Таблица `instance_config`
- Единичен ред (първият създаден става "активен").
- Колони: `branding`, `features`, `languages`, `social_credentials` (всички JSONB), timestamp-и.
- Миграцията `1767800000000-AddSocialCredentialsToInstanceConfig.ts` добавя `social_credentials` и
  се грижи за първоначални стойности от env.

## 2. `SettingsService`
Ключови методи:

| Метод | Роля |
| --- | --- |
| `getOrCreateInstanceConfig()` | Връща (или създава) InstanceConfig с default values + env social creds. |
| `updateInstanceConfig(dto)` | Merge-ва incoming DTO-та и пази валидността на масивите език/функции. |
| `getSocialCredentials()` | Взема записаните в DB креденшъли. |
| `getEffectiveSocialProviderCredentials(provider)` | Връща DB стойности ако ги има, иначе чете env. |
| `getSanitizedSocialCredentials()` | Подава към FE само `clientId`, `redirectUri`, `hasClientSecret`. |

### Merge логика за social creds
```ts
const socialCredentials = dto.socialCredentials
  ? this.mergeSocialCredentials(existing, dto.socialCredentials)
  : existing;
```
- `clientId`/`redirectUri`/`clientSecret` се третират поотделно, trim-вани.
- `null` означава "изтрий", `undefined` -> запази.
- Ако и трите полета са празни, provider-ът се маха от JSONB.

## 3. Admin API (`admin-settings.controller.ts`)
- `GET /admin/settings`: връща branding/features/languages + `socialProviders` статус + `socialCredentials`
  (sanitized).
- `PATCH /admin/settings`: приема `AdminUpdateInstanceSettingsDto`, в която `socialCredentials` е
  по избор.

### DTO структура
```ts
AdminUpdateSocialProviderCredentialsDto {
  clientId?: string | null;
  clientSecret?: string | null;
  redirectUri?: string | null;
}
```
- FE може да изпрати нов secret (string), да го изтрие (`null`) или да не го пипа (undefined).
- Backend проверява езиковите масиви (`supported.length >= 1`, default ∈ supported).

## 4. Frontend поведение
- Страницата `/admin/settings` показва чекбокси за feature flags + нова секция **"OAuth креденшъли"**.
- Полетата за Client ID / Redirect URL са обикновени input-и. Secret полето е password и изпраща
  стойността само ако е въведена.
- Чекбокс "Изтрий secret" задава `clientSecret: null`.
- Успешно PATCH -> UI реинициализира state с върнатите sanitized creds.

## 5. Fallback към `.env`
- Ако в DB няма стойности (или са изтрити), `SettingsService.getEffectiveSocialProviderCredentials`
  връща env стойностите.
- Това поведение е описано и в README (`2.4.3`) и `03-social-credentials.md`.

## 6. Следващ урок
Продължи с `03-social-credentials.md`, където описваме детайлно как OAuth услугите и
SocialLoginAvailabilityService използват тази конфигурация.
