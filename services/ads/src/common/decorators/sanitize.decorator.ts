import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Декоратор за санитизация на HTML съдържание в полетата на DTO класове
 * @returns Декоратор, който санитизира данните при трансформация
 */
export function Sanitize() {
  return applyDecorators(
    Transform(({ value }): unknown => {
      if (typeof value !== 'string') {
        return value;
      }

      // Премахваме всички HTML тагове и атрибути
      return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode:
          'recursiveEscape' as sanitizeHtml.DisallowedTagsModes,
      });
    }),
  );
}
