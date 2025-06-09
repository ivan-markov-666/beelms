import { SetMetadata } from '@nestjs/common';

/**
 * Ключ за метаданните за публичен API достъп
 */
export const IS_PUBLIC_API_KEY = 'isPublicApi';

/**
 * Декоратор, който маркира ендпойнт като публичен (не изисква JWT автентикация)
 * Може да се използва на ниво контролер или метод
 *
 * Пример:
 * @PublicApi()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 */
export const PublicApi = () => SetMetadata(IS_PUBLIC_API_KEY, true);
