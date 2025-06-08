import { Injectable, PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { isObject } from 'class-validator';

type SanitizedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanitizedObject
  | SanitizedArray;
interface SanitizedObject {
  [key: string]: SanitizedValue;
}
type SanitizedArray = SanitizedValue[];

@Injectable()
export class SanitizeHtmlPipe implements PipeTransform {
  // Конфигурация за sanitize-html - позволява безопасни HTML елементи и атрибути
  private readonly options: sanitizeHtml.IOptions = {
    allowedTags: [], // Не позволяваме никакви тагове, ще ги премахнем
    allowedAttributes: {}, // Не позволяваме никакви атрибути
    disallowedTagsMode: 'recursiveEscape' as sanitizeHtml.DisallowedTagsModes, // Escape на недопустими тагове
  };

  // Трансформира входните данни и санитизира ги от XSS атаки
  transform(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // За string стойности
    if (typeof value === 'string') {
      return sanitizeHtml(value, this.options);
    }

    // За масиви
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeItem(item));
    }

    // За обекти
    if (isObject(value) && value.constructor === Object) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }

    return value;
  }

  // Рекурсивна санитизация на обект
  private sanitizeObject(obj: Record<string, unknown>): SanitizedObject {
    const result: SanitizedObject = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.sanitizeItem(obj[key]);
      }
    }
    return result;
  }

  // Санитизация на единична стойност, базирана на нейния тип
  private sanitizeItem(item: unknown): SanitizedValue {
    if (typeof item === 'string') {
      return sanitizeHtml(item, this.options);
    }

    if (Array.isArray(item)) {
      return item.map((element) => this.sanitizeItem(element));
    }

    if (isObject(item) && item.constructor === Object) {
      return this.sanitizeObject(item as Record<string, unknown>);
    }

    // Връщаме примитивни стойности непроменени (number, boolean, etc.)
    return item as SanitizedValue;
  }
}
