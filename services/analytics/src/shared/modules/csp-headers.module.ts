import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CspHeadersMiddleware } from '../middleware/csp-headers.middleware';

/**
 * CSP Headers Module
 *
 * Този модул регистрира CspHeadersMiddleware, който добавя
 * Content Security Policy хедъри към всички HTTP отговори
 */
@Module({})
export class CspHeadersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CspHeadersMiddleware).forRoutes('*');
  }
}
