# Auth API – примерни заявки

Този документ съдържа примерни `curl` заявки за основните Auth endpoint-и на beelms.

- Base URL (dev): `http://localhost:3000/api`
- Всички заявки, които изискват токен, ползват Bearer JWT, издаден от `/auth/login`.

> Забележка: Текстовете на грешките и точният отговор може да се различават леко от примерите тук – за authoritative дефиниция използвайте `docs/architecture/openapi.yaml`.

---

## 1. Регистрация – POST /auth/register

Създава нов потребител с роля `user`. При успех връща `UserProfile` без access token.

```bash
curl -X POST \\
  "http://localhost:3000/api/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "new.user@example.com",
    "password": "Aa!123456"
  }'
```

Примерен 201 отговор (съкратен):

```json
{
  "id": "f96b...",
  "email": "new.user@example.com",
  "role": "user",
  "createdAt": "2025-01-10T09:30:00.000Z"
}
```

---

## 2. Вход – POST /auth/login

Връща JWT token (Bearer).

```bash
curl -X POST \\
  "http://localhost:3000/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "new.user@example.com",
    "password": "Aa!123456"
  }'
```

Примерен 200 отговор:

```json
{
  "accessToken": "<JWT_TOKEN>",
  "tokenType": "Bearer"
}
```

---

## 3. Профил на текущия потребител – GET /users/me

Този endpoint се използва от FE (например `/profile`, Admin layout) за да зареди профилните данни и ролята на потребителя.

```bash
curl -X GET \\
  "http://localhost:3000/api/users/me" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Accept: application/json"
```

Примерен 200 отговор (съкратен):

```json
{
  "id": "f96b...",
  "email": "new.user@example.com",
  "role": "admin",
  "createdAt": "2025-01-10T09:30:00.000Z"
}
```

---

## 4. Forgot password – POST /auth/forgot-password

Използва се от страницата `/auth/forgot-password`.
В dev среда линкът за reset обикновено се логва в BE логовете или се изпраща през тестов mailing layer.

```bash
curl -X POST \\
  "http://localhost:3000/api/auth/forgot-password" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "existing.user@example.com"
  }'
```

- При успех: `200` без тяло или с кратко съобщение.
- При невалидни данни: `400`.

---

## 5. Reset password – POST /auth/reset-password

Reset линкът съдържа token (примерно `/auth/reset-password?token=...` на FE).
Самият BE endpoint очаква JSON тяло с `token` и новата парола.

```bash
curl -X POST \\
  "http://localhost:3000/api/auth/reset-password" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "<RESET_TOKEN>",
    "newPassword": "Bb!987654"
  }'
```

Възможни отговори:

- `200` – паролата е сменена успешно.
- `400` – невалиден или изтекъл token.

---

## 6. Verify email – POST /auth/verify-email

Ползва се след регистрация или смяна на имейл. Линкът съдържа `token`, който FE праща към BE.

```bash
curl -X POST \\
  "http://localhost:3000/api/auth/verify-email" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "<VERIFY_TOKEN>"
  }'
```

- `200` – имейлът е потвърден успешно.
- `400` – невалиден/изтекъл verification token.

---

## 7. Примерен auth flow за тестове

1. **Регистрирай** нов потребител чрез `/auth/register`.
2. **Логни се** чрез `/auth/login` и вземи `accessToken`.
3. За нуждите на dev/test:
   - Ако трябва да направиш потребителя admin, актуализирай ролята му през Admin Users UI или директно през БД (в dev).
4. Използвай `accessToken` за:
   - `/users/me` – да потвърдиш, че ролята и статусът са правилни;
   - Admin endpoint-и (напр. `/admin/wiki/...`, `/admin/metrics/overview`).

За по-пълни детайли (всички полета, грешки и статус кодове) виж `docs/architecture/openapi.yaml` в секцията **Auth Service**.

