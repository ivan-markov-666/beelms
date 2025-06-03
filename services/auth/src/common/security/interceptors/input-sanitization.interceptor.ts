import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import sanitizeHtml from 'sanitize-html';
import { Request } from 'express';

@Injectable()
export class InputSanitizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Санитизиране на тялото на заявката
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    // Санитизиране на параметрите на заявката
    if (request.params) {
      request.params = this.sanitizeObject(request.params);
    }

    // Санитизиране на query параметрите
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }

    return next.handle().pipe(
      map((data) => {
        // По избор може да се дезинфекцират и изходящите данни
        // но това може да повлияе на производителността
        return data;
      }),
    );
  }

  private sanitizeObject(
    obj: Record<string, any> | string | null | undefined,
  ): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    const result = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        result[key] = this.sanitizeObject(value);
      }
    }

    return result;
  }

  private sanitizeString(text: string): string {
    return sanitizeHtml(text, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      allowedAttributes: {
        a: ['href', 'target'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });
  }
}
