import { SetMetadata } from '@nestjs/common';

/**
 * Декоратор за изключване на Rate Limiting за определени ендпойнти
 * Може да се използва на ниво контролер или метод
 * @returns декоратор
 */
export const SkipThrottle = () => SetMetadata('skip-throttle', true);

/**
 * Декоратор за прилагане на различни лимити за определени ендпойнти
 * @param options Опции за Rate Limiting - ttl (време в секунди) и limit (брой заявки)
 * @returns декоратор
 */
export const Throttle = (ttl: number, limit: number) =>
  SetMetadata('throttle-options', { ttl, limit });
