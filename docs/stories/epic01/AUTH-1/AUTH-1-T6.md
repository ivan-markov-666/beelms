# AUTH-1-T6: API документация

## Описание
Създаване на пълна и точна API документация с помощта на Swagger/OpenAPI.

## Спецификация на API

### Основни ендпойнти

#### 1. Регистрация на потребител
```yaml
/register:
  post:
    tags:
      - Auth
    summary: Регистриране на нов потребител
    description: Създава нов потребителски акаунт и изпраща имейл за потвърждение
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/RegisterDto'
    responses:
      '202':
        description: Заявката за регистрация е приета
        headers:
          Location:
            schema:
              type: string
              example: /auth/verification-pending
      '400':
        description: Невалидни входни данни
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidationError'
      '409':
        description: Потребител с този имейл вече съществува
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
```

#### 2. Потвърждение на имейл
```yaml
/verify-email:
  get:
    tags:
      - Auth
    summary: Потвърждаване на имейл адрес
    parameters:
      - name: token
        in: query
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Имейлът е потвърден успешно
      '400':
        description: Невалиден или изтекъл токен
      '404':
        description: Токенът не е намерен
```

## Компоненти

### Схеми

#### RegisterDto
```yaml
RegisterDto:
  type: object
  required:
    - email
    - password
    - firstName
    - lastName
  properties:
    email:
      type: string
      format: email
      example: user@example.com
    password:
      type: string
      format: password
      minLength: 12
      example: SecurePass123!
    firstName:
      type: string
      minLength: 2
      example: John
    lastName:
      type: string
      minLength: 2
      example: Doe
```

#### ErrorResponse
```yaml
ErrorResponse:
  type: object
  properties:
    statusCode:
      type: integer
      format: int32
    error:
      type: string
    message:
      type: string
    timestamp:
      type: string
      format: date-time
    path:
      type: string
```

## Документация за разработчици

### Аутентикация
- Използва се JWT за удостоверяване
- Токените се изпращат в `Authorization` header:
  ```
  Authorization: Bearer <token>
  ```

### Грешки
Всички грешки следват един и същи формат:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid input data",
  "timestamp": "2023-04-01T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### Rate Limiting
- 100 заявки на минута на IP адрес
- 5 заявки на минута за ендпойнтите за автентикация

## Интеграция с Swagger UI
- Достъпна на `/api/docs`
- Включва интерактивна документация
- Възможност за изпращане на заявки директно от браузъра

## Критерии за приемане
- [ ] Всички ендпойнти са документирани
- [ ] Документацията е достъпна на български и английски
- [ ] Има примери за всички заявки и отговори
- [ ] Документирани са всички възможни грешки
- [ ] Интеграцията със Swagger UI работи коректно

## Зависимости
- [AUTH-1-T3](AUTH-1-T3.md)
- [AUTH-1-T4](AUTH-1-T4.md)

## Свързани файлове
- `src/main.ts` (Swagger конфигурация)
- `src/common/decorators/api-docs.decorator.ts`
- `src/common/dto/*.dto.ts`
