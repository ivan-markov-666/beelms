import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || '';
    const now = Date.now();

    this.logger.log(`Request: ${method} ${url} from ${ip} using ${userAgent}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          const statusCode = res.statusCode;

          this.logger.log(
            `Response: ${method} ${url} ${statusCode} - ${responseTime}ms`,
          );

          // Може да се добави допълнителна логика за алармиране при твърде бавни заявки
          if (responseTime > 1000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} - ${responseTime}ms`,
            );
          }
        },
        error: (err: unknown) => {
          const responseTime = Date.now() - now;

          let errorMessage = 'Unknown error';
          let errorStack = 'No stack trace';

          if (err instanceof Error) {
            errorMessage = err.message;
            errorStack = err.stack || 'No stack trace';
          } else if (typeof err === 'string') {
            errorMessage = err;
          }

          this.logger.error(
            `Error in ${method} ${url} - ${errorMessage} after ${responseTime}ms`,
            errorStack,
          );
        },
      }),
    );
  }
}
