import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SQL Sanitizer Service
 *
 * Предоставя допълнителни защити срещу SQL инжекции извън
 * вградените защити на TypeORM.
 */
@Injectable()
export class SqlSanitizerService {
  private readonly logger = new Logger(SqlSanitizerService.name);
  private readonly sqlInjectionPatterns: RegExp[];

  constructor(private configService: ConfigService) {
    // Регулярни изрази за различни видове SQL инжекции
    this.sqlInjectionPatterns = [
      // Базови SQL инжекции
      /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)(\s+)/i,
      // UNION базирани атаки
      /(\s|^)(UNION(\s+)ALL|UNION)(\s+)/i,
      // Коментари в SQL
      /(--|\/\*|\*\/|#)/,
      // Манипулация с данните
      /(\s|^)(OR|AND)(\s+)('|"|`)?\d('|"|`)?(\s*)=(\s*)('|"|`)?\d('|"|`)?/i,
      // SLEEP или забавяне
      /(\s|^)(SLEEP|BENCHMARK|PG_SLEEP|WAITFOR DELAY)(\s*)\(/i,
      // XP_CMDSHELL и други опасни функции
      /(\s|^)(XP_CMDSHELL|EXEC|EXECUTE|SHELL|SYSTEM)(\s*)\(/i,
    ];
  }

  /**
   * Проверява низ или обект за потенциални SQL инжекции
   * @param input Входен низ или обект
   * @returns true ако входът е безопасен, false ако е открита потенциална SQL инжекция
   */
  public isSqlSafe(input: unknown): boolean {
    // Ако входът е null или undefined, считаме го за безопасен
    if (input === null || input === undefined) {
      return true;
    }

    // Проверка на низ
    if (typeof input === 'string') {
      return this.checkSqlString(input);
    }

    // Проверка на обект или масив
    if (typeof input === 'object') {
      return this.recursiveCheckObject(input);
    }

    // Числа, булеви и дати са безопасни
    return true;
  }

  /**
   * Връща безопасна версия на входен низ или параметър
   * @param input Входен низ или обект
   * @returns Безопасна версия на входа
   */
  public sanitize(input: unknown): unknown {
    // Ако е null или undefined, връщаме директно
    if (input === null || input === undefined) {
      return input;
    }

    // За низове прилагаме почистване
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    // За обекти или масиви, рекурсивно обработваме всички стойности
    if (typeof input === 'object') {
      if (Array.isArray(input)) {
        return input.map((item) => this.sanitize(item));
      } else {
        const result = { ...(input as Record<string, unknown>) };
        for (const key in result) {
          if (Object.prototype.hasOwnProperty.call(result, key)) {
            result[key] = this.sanitize(result[key]);
          }
        }
        return result;
      }
    }

    // Връщаме непроменен вход за всички други типове
    return input;
  }

  /**
   * Проверява низ за SQL инжекции
   */
  private checkSqlString(input: string): boolean {
    // Празен низ е безопасен
    if (!input || input.trim() === '') {
      return true;
    }

    // Проверка за съвпадение с шаблони за SQL инжекции
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        this.logSqlInjectionAttempt(input, pattern.toString());
        return false;
      }
    }

    // Допълнителни проверки за специфични SQL инжекции
    if (
      input.includes('=') &&
      input.includes("'") &&
      (input.includes(' or ') || input.includes(' OR '))
    ) {
      this.logSqlInjectionAttempt(input, 'OR базирана инжекция');
      return false;
    }

    return true;
  }

  /**
   * Рекурсивно проверява обект или масив
   */
  private recursiveCheckObject(obj: unknown): boolean {
    // За масив, проверяваме всеки елемент
    if (Array.isArray(obj)) {
      return obj.every((item) => this.isSqlSafe(item));
    }

    // За обект, проверяваме всяка стойност
    if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
      for (const key in obj) {
        if (
          Object.prototype.hasOwnProperty.call(obj, key) &&
          !this.isSqlSafe((obj as Record<string, unknown>)[key])
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Почиства низ от потенциални SQL инжекции
   */
  private sanitizeString(input: string): string {
    if (!input) return input;

    // Заменяме опасни символи
    let sanitized = input
      .replace(/'/g, "''") // Escape единични кавички
      .replace(/\\/g, '\\\\'); // Escape backslash

    // Премахваме директно коментарите
    sanitized = sanitized
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/#/g, '');

    // Заменяме пробелите около опасни ключови думи
    // За example, "OR 1=1" става "OR1=1", което е безопасно
    for (const pattern of this.sqlInjectionPatterns) {
      sanitized = sanitized.replace(pattern, (match) => {
        return match.replace(/\s+/g, '');
      });
    }

    return sanitized;
  }

  /**
   * Логва опит за SQL инжекция
   */
  private logSqlInjectionAttempt(input: string, pattern: string): void {
    this.logger.warn(
      `[SECURITY] Възможен опит за SQL инжекция открит: "${input.substring(0, 50)}${
        input.length > 50 ? '...' : ''
      }" съответства на шаблон: ${pattern}`,
    );
  }
}
