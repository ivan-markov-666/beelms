import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { SanitizeHtmlPipe } from './pipes/sanitize-html.pipe';
import { SanitizeInterceptor } from './interceptors/sanitize.interceptor';

@Module({
  providers: [
    // Добавяме SanitizeHtmlPipe като основен provider
    SanitizeHtmlPipe,
    // Регистриране на SanitizeHtmlPipe като глобален pipe
    {
      provide: APP_PIPE,
      useClass: SanitizeHtmlPipe,
    },
    // Регистриране на SanitizeInterceptor като глобален interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeInterceptor,
    },
  ],
  exports: [SanitizeHtmlPipe],
})
export class CommonModule {}
