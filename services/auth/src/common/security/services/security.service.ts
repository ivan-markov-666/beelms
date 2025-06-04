import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly pepper: string;
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    // Pepper - допълнителна тайна, която се добавя към паролите преди хеширане
    this.pepper = this.configService.get<string>(
      'PASSWORD_PEPPER',
      'default-pepper-value',
    );
    this.saltRounds = this.configService.get<number>(
      'PASSWORD_SALT_ROUNDS',
      12,
    );

    if (this.pepper === 'default-pepper-value') {
      this.logger.warn(
        'Using default pepper value. Consider setting PASSWORD_PEPPER in environment variables.',
      );
    }
  }

  /**
   * Хешира парола с bcrypt и добавя pepper
   * @param password Паролата за хеширане
   * @returns Хеширана парола
   */
  async hashPassword(password: string): Promise<string> {
    // Добавяне на pepper към паролата
    const pepperedPassword = this.addPepper(password);

    // Хеширане с bcrypt
    return bcrypt.hash(pepperedPassword, this.saltRounds);
  }

  /**
   * Сравнява парола с хеширана парола
   * @param password Паролата за проверка
   * @param hashedPassword Хеширана парола за сравнение
   * @returns true ако паролите съвпадат
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    // Добавяне на pepper към паролата
    const pepperedPassword = this.addPepper(password);

    // Сравняване с bcrypt
    return bcrypt.compare(pepperedPassword, hashedPassword);
  }

  /**
   * Генерира сигурен токен
   * @param length Дължина на токена (по подразбиране 32 байта)
   * @returns Токен в хексадецимален формат
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Нормализира и дезинфекцира вход
   * @param input Вход за дезинфекция
   * @returns Дезинфекциран вход
   */
  sanitizeInput(input: string): string {
    // Базова нормализация - премахване на излишни интервали и контролни символи
    // Replace control characters with safer approach
    // Filter out control characters using Array methods instead of regex
    const chars = input.trim().split('');
    let sanitized = chars
      .filter((char) => {
        const code = char.charCodeAt(0);
        return !(code <= 0x1f || code === 0x7f);
      })
      .join('');

    // Escape на HTML специални символи
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return sanitized;
  }

  /**
   * Проверява силата на паролата
   * @param password Парола за проверка
   * @returns true ако паролата е достатъчно силна
   */
  isStrongPassword(password: string): boolean {
    // Минимална дължина
    if (password.length < 8) {
      return false;
    }

    // Проверка за различни типове символи
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    // Изискване за поне 3 от 4-те типа символи
    const criteria = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChar];
    const metCriteria = criteria.filter((c) => c).length;

    return metCriteria >= 3;
  }

  /**
   * Добавя pepper към паролата
   * @param password Парола
   * @returns Парола с добавен pepper
   */
  private addPepper(password: string): string {
    return `${password}${this.pepper}`;
  }
}
