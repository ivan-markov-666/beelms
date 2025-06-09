import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as validator from 'validator';

/**
 * Input Validation Middleware
 *
 * Този middleware изпълнява базови проверки за валидност на входящите данни,
 * включително проверки за SQL инжекции и други потенциално опасни входни данни.
 */
@Injectable()
export class InputValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    try {
      if (req.body) {
        this.validateRequestData(req.body as Record<string, any>);
      }

      // Валидиране на query параметри
      if (req.query && Object.keys(req.query).length > 0) {
        this.validateRequestData(req.query as Record<string, any>);
      }

      // Валидиране на параметри в URL адреса
      if (req.params && Object.keys(req.params).length > 0) {
        this.validateRequestData(req.params as Record<string, any>);
      }

      next();
    } catch (error) {
      if (error instanceof BadRequestException) {
        next(error);
      } else {
        console.error('Грешка при валидация на входните данни:', error);
        next(new BadRequestException('Невалидни входящи данни'));
      }
    }
  }

  /**
   * Валидира данните рекурсивно
   * @param data Данни за валидиране
   */
  private validateRequestData(data: Record<string, any>): void {
    if (!data) return;

    // Валидиране на всеки параметър в обекта или масива
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      // Рекурсивна проверка за вложени обекти и масиви
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'object' && item !== null) {
              this.validateRequestData(item as Record<string, any>);
            } else if (typeof item === 'string') {
              this.validateStringValue(item, key);
            }
          });
        } else {
          this.validateRequestData(value as Record<string, any>);
        }
      } else if (typeof value === 'string') {
        this.validateStringValue(value, key);
      }
    });
  }

  /**
   * Валидира стрингова стойност за различни заплахи
   * @param value Стойност за валидиране
   * @param fieldName Име на полето
   */
  private validateStringValue(value: string, fieldName: string): void {
    // Проверка за SQL инжекции
    if (this.containsSqlInjection(value)) {
      throw new BadRequestException(
        `Невалидна стойност за поле ${fieldName}: открита е потенциална SQL инжекция`,
      );
    }

    // Специални проверки за полета според името им
    switch (fieldName.toLowerCase()) {
      case 'email':
        if (!validator.isEmail(value)) {
          throw new BadRequestException('Невалиден имейл адрес');
        }
        break;

      case 'password':
        if (value.length < 8) {
          throw new BadRequestException('Паролата трябва да е поне 8 символа');
        }
        break;

      case 'date':
      case 'birthdate':
        if (!validator.isDate(value)) {
          throw new BadRequestException(`Невалидна дата: ${fieldName}`);
        }
        break;

      case 'url':
      case 'website':
        if (!validator.isURL(value)) {
          throw new BadRequestException(`Невалиден URL адрес: ${fieldName}`);
        }
        break;
    }
  }

  /**
   * Проверка за SQL инжекции
   * @param value Стойност за проверка
   * @returns true ако е открита потенциална SQL инжекция
   */
  private containsSqlInjection(value: string): boolean {
    // Базова проверка за често срещани SQL инжекционни атаки
    const sqlInjectionPatterns = [
      /(\b)(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|CREATE|WHERE)(\b)/i,
      /(\b)(?:OR|AND)(\b)[ \t]*['"]?[ \t]*\w+[ \t]*['"]?[ \t]*[=<>]/i,
      /--/,
      /\/\*/,
      /;[ \t]*\w+[ \t]*[(`]/i,
      /UNION[ \t]+(ALL|SELECT)/i,
      /CONVERT[ \t]*\(/i,
    ];

    return sqlInjectionPatterns.some((pattern) => pattern.test(value));
  }
}
