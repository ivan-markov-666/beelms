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
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';

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
        error: (err) => {
          const responseTime = Date.now() - now;

          this.logger.error(
            `Error in ${method} ${url} - ${err.message} after ${responseTime}ms`,
            err.stack,
          );
        },
      }),
    );
  }
}
