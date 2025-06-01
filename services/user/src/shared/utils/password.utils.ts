import * as crypto from 'crypto';

export class PasswordUtils {
  private static readonly ITERATIONS = 10000;
  private static readonly KEY_LENGTH = 64;
  private static readonly DIGEST = 'sha512';

  private static readonly PEPPER =
    process.env.PASSWORD_PEPPER || 'default-pepper-value'; // Лучше использовать переменную окружения

  /**
   * Генерирует случайную соль
   */
  static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Хеширует пароль с заданной солью
   * @param password Пароль для хеширования
   * @param salt Соль для хеширования
   * @returns Хешированный пароль
   */
  static hashPassword(password: string, salt: string): string {
    // Добавляем перец к паролю для дополнительной защиты
    const pepperedPassword = password + this.PEPPER;

    // Генерируем хеш с использованием PBKDF2
    return crypto
      .pbkdf2Sync(
        pepperedPassword,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        this.DIGEST,
      )
      .toString('hex');
  }

  /**
   * Проверяет правильность пароля
   * @param plainPassword Введенный пароль в открытом виде
   * @param hashedPassword Хешированный пароль из базы данных
   * @param salt Соль из базы данных
   * @returns true если пароль верный, иначе false
   */
  static verifyPassword(
    plainPassword: string,
    hashedPassword: string,
    salt: string,
  ): boolean {
    const hash = this.hashPassword(plainPassword, salt);
    return hash === hashedPassword;
  }
}
