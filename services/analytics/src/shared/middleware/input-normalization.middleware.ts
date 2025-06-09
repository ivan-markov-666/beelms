import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Input Normalization Middleware
 *
 * Нормализира входните данни, като стандартизира формати и типове данни
 * и осигурява последователна обработка на входа.
 */
@Injectable()
export class InputNormalizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(InputNormalizationMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      if (req.body && typeof req.body === 'object') {
        this.normalizeObject(req.body as Record<string, unknown>);
      }

      if (req.query && typeof req.query === 'object') {
        this.normalizeObject(req.query as Record<string, unknown>);
      }

      if (req.params && typeof req.params === 'object') {
        this.normalizeObject(req.params as Record<string, unknown>);
      }

      next();
    } catch (error) {
      this.logger.warn(
        `Грешка при нормализиране на входни данни: ${(error as Error).message}`,
      );
      next();
    }
  }

  /**
   * Рекурсивно нормализира обект
   */
  private normalizeObject(obj: Record<string, unknown>): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        // Обработваме вложени обекти рекурсивно
        if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          this.normalizeObject(value as Record<string, unknown>);
          continue;
        }

        // Нормализираме масиви
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (value[i] !== null && typeof value[i] === 'object') {
              this.normalizeObject(value[i] as Record<string, unknown>);
            } else {
              value[i] = this.normalizeValue(value[i], key);
            }
          }
          continue;
        }

        // Нормализираме скаларни стойности
        obj[key] = this.normalizeValue(value, key);
      }
    }
  }

  /**
   * Нормализира стойност в зависимост от типа ѝ и името на полето
   */
  private normalizeValue(value: unknown, key: string): unknown {
    // Игнорираме null и undefined стойности
    if (value === null || value === undefined) {
      return value;
    }

    // Нормализираме стрингове
    if (typeof value === 'string') {
      // Тримваме всички стрингове
      const strValue: string = value.trim();

      // Проверяваме за специфични видове полета по име
      const lowercaseKey = key.toLowerCase();

      // Нормализираме email адреси
      if (lowercaseKey.includes('email')) {
        return strValue.toLowerCase();
      }

      // Нормализираме телефонни номера (премахване на специални знаци)
      if (lowercaseKey.includes('phone') || lowercaseKey.includes('телефон')) {
        return strValue.replace(/[^\d+]/g, '');
      }

      // Нормализираме дати в ISO формат
      if (
        lowercaseKey.includes('date') ||
        lowercaseKey.includes('дата') ||
        lowercaseKey === 'dob' ||
        lowercaseKey.includes('birthday')
      ) {
        // Проверяваме дали е валидна дата
        if (/^\d{4}-\d{2}-\d{2}/.test(strValue)) {
          try {
            const date = new Date(strValue);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]; // Връщаме само датата, без час
            }
          } catch {
            // Връщаме оригиналната стойност, ако не можем да я парснем
          }
        }
      }

      // Нормализираме URL адреси
      if (lowercaseKey.includes('url') || lowercaseKey.includes('website')) {
        // Добавяме https:// ако протоколът липсва
        if (strValue.length > 0 && !strValue.match(/^[a-zA-Z]+:\/\//)) {
          return `https://${strValue}`;
        }
      }

      // Нормализираме потребителски имена
      if (
        lowercaseKey === 'username' ||
        lowercaseKey === 'user' ||
        lowercaseKey.includes('потребител')
      ) {
        // Премахваме интервали и специални знаци
        return strValue.toLowerCase().replace(/\s+/g, '');
      }

      return strValue;
    }

    // Нормализираме числа
    if (typeof value === 'number') {
      // Проверка за NaN или Infinity
      if (isNaN(value) || !isFinite(value)) {
        return null;
      }
      return value;
    }

    // Нормализираме булеви стойности
    if (typeof value === 'boolean') {
      return value;
    }

    // За всичко останало, връщаме оригиналната стойност
    return value;
  }
}
