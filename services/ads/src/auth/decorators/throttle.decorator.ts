import { SetMetadata } from '@nestjs/common';

/**
 * Декоратор за настройване на Rate Limiting параметри за конкретен контролер или метод
 * @param ttl Времето в секунди, през което се отчита броят на заявките
 * @param limit Максимален брой разрешени заявки за периода
 */
export const SkipThrottle = () => SetMetadata('skipThrottle', true);

export const Throttle = (ttl: number, limit: number) =>
  SetMetadata('throttle', { ttl, limit });
