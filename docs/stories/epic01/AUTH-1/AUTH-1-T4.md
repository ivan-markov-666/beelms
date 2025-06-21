# AUTH-1-T4: Верификационни токени

## Описание
Управление на верификационните токени за потвърждаване на имейл адреси и нулиране на пароли.

## Видове токени

### 1. Имейл Верификация
- **Цел**: Потвърждаване на имейл адрес при регистрация
- **Валидност**: 24 часа
- **Еднократна употреба**: Да
- **Съдържание**:
  ```typescript
  interface EmailVerificationTokenPayload {
    userId: string;
    email: string;
    type: 'email_verification';
  }
  ```

### 2. Нулиране на парола
- **Цел**: Потвърждаване на самоличност при забравена парола
- **Валидност**: 1 час
- **Еднократна употреба**: Да
- **Съдържание**:
  ```typescript
  interface PasswordResetTokenPayload {
    userId: string;
    email: string;
    type: 'password_reset';
  }
  ```

## База данни
### verification_tokens таблица
```sql
CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_token_type CHECK (type IN ('email_verification', 'password_reset')),
  CONSTRAINT uq_token_hash UNIQUE (token_hash)
);

-- Индекси
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token_hash ON verification_tokens(token_hash);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires_at) WHERE used_at IS NULL;
```

## TokenService

### Методи
- `generateToken(userId: string, email: string, type: TokenType): Promise<string>`
  - Генерира криптографски сигурен токен
  - Записва хеширана версия в базата данни
  - Връща plain-text токен за изпращане по имейл

- `verifyToken(token: string, type: TokenType): Promise<{valid: boolean; payload?: TokenPayload; error?: string}>`
  - Валидира токена спрямо базата данни
  - Проверява дали не е изтекъл или вече използван
  - Връща payload при успех

- `revokeToken(token: string): Promise<void>`
  - Маркира токена като използван
  - Използва се след успешна верификация

- `cleanupExpiredTokens(): Promise<number>`
  - Премахва изтекли токени
  - Изпълнява се периодично от CRON задача

## Сигурност
- Токените се съхраняват само като хеш в базата данни
- Използва се bcrypt за хеширане на токените
- Валидност по подразбиране: 24 часа за имейл верификация, 1 час за нулиране на парола
- Автоматично почистване на изтекли токени

## Критерии за приемане
- [ ] Генерирането на токени работи коректно
- [ ] Валидацията на токени работи както се очаква
- [ ] Токените не могат да се използват повторно
- [ ] Изтеклите токени се почистват автоматично
- [ ] Има тестове за всички сценарии

## Зависимости
- [AUTH-1-T1](AUTH-1-T1.md)

## Свързани файлове
- `src/auth/services/token.service.ts`
- `src/entities/verification-token.entity.ts`
- `src/migrations/*-create-verification-tokens-table.ts`
- `test/auth/services/token.service.spec.ts`
