import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  // Стандартна конфигурация за sanitize-html
  private readonly options: sanitizeHtml.IOptions = {
    allowedTags: [], // Не позволяваме никакви тагове, ще ги премахнем
    allowedAttributes: {}, // Не позволяваме никакви атрибути
    disallowedTagsMode: 'recursiveEscape' as sanitizeHtml.DisallowedTagsModes, // Escape на недопустими тагове
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Обработваме само отговорите (response data), защото входните данни се
    // обработват от ValidationPipe и @Sanitize декоратора
    return next.handle().pipe(
      map((data) => {
        return this.sanitizeData(data);
      }),
    );
  }

  private sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    // За string стойности
    if (typeof data === 'string') {
      return sanitizeHtml(data, this.options);
    }

    // За масиви
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    // За обекти
    if (
      data &&
      typeof data === 'object' &&
      Object.getPrototypeOf(data) === Object.prototype
    ) {
      const result: Record<string, unknown> = {};
      const objectData = data as Record<string, unknown>;
      for (const key in objectData) {
        if (Object.prototype.hasOwnProperty.call(objectData, key)) {
          result[key] = this.sanitizeData(objectData[key]);
        }
      }
      return result;
    }

    // Връщаме примитивни стойности непроменени (number, boolean, etc.)
    return data;
  }
}
