import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';

/**
 * Декоратор, който добавя документация в Swagger за сигурностните механизми
 * Добавя информация за JWT автентикация и API защита
 */
export function ApiSecurityDocs() {
  return applyDecorators(
    ApiSecurity('bearer'),
    ApiHeader({
      name: 'Authorization',
      description: 'JWT токен за автентикация: Bearer {token}',
      required: true,
    }),
    ApiHeader({
      name: 'X-API-KEY',
      description: 'API ключ за достъп (опционален)',
      required: false,
    }),
  );
}
