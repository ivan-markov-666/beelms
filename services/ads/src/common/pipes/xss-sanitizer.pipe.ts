import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class XssSanitizerPipe implements PipeTransform<unknown, unknown> {
  private readonly sanitizeOptions: sanitizeHtml.IOptions = {
    // Разрешаваме само безопасни HTML тагове и атрибути
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    allowedAttributes: {}, // Без атрибути по подразбиране
    disallowedTagsMode: 'recursiveEscape',
    // Премахваме JavaScript събития и други опасни конструкции
    allowedSchemes: ['http', 'https', 'mailto'],
  };

  // Рекурсивна санитизация на всички стрингове в обект
  private sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return sanitizeHtml(obj, this.sanitizeOptions);
    }

    if (typeof obj === 'object') {
      // We've already checked obj is 'object', so Array.isArray is safe
      if (Array.isArray(obj)) {
        return obj.map((item) => this.sanitizeObject(item));
      }

      const result: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = this.sanitizeObject(
            (obj as Record<string, unknown>)[key],
          );
        }
      }
      return result;
    }

    // Други типове данни (числа, булеви и т.н.) се връщат непроменени
    return obj;
  }

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Санитизираме само входните данни от тип body, query или param
    if (
      metadata.type === 'body' ||
      metadata.type === 'query' ||
      metadata.type === 'param'
    ) {
      return this.sanitizeObject(value);
    }

    return value;
  }
}
