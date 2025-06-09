import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption Service
 *
 * Предоставя методи за криптиране и декриптиране на чувствителни данни.
 * Използва AES-256-GCM алгоритъм за криптиране, който осигурява както
 * конфиденциалност, така и интегритет на данните.
 */
@Injectable()
export class EncryptionService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 16 bytes (128 bits)
  private readonly authTagLength = 16; // 16 bytes (128 bits) за GCM автентикация

  constructor(private configService: ConfigService) {
    // Взимаме ключа от конфигурацията или генерираме такъв
    const configKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (configKey) {
      // Използваме ключа от конфигурацията, като създаваме SHA-256 hash за осигуряване на правилната дължина
      this.encryptionKey = crypto
        .createHash('sha256')
        .update(configKey)
        .digest();
    } else {
      // Генерираме ключ на базата на други конфигурационни променливи
      const appSecret = this.configService.get<string>(
        'APP_SECRET',
        'default_app_secret',
      );
      const appEnv = this.configService.get<string>('NODE_ENV', 'development');
      const derivedKey = `${appSecret}_${appEnv}_encryption_key`;

      this.encryptionKey = crypto
        .createHash('sha256')
        .update(derivedKey)
        .digest();

      // Предупреждаваме ако нямаме изрично зададен ключ в production среда
      if (appEnv === 'production') {
        console.warn(
          'ПРЕДУПРЕЖДЕНИЕ: Липсва ENCRYPTION_KEY в конфигурацията. Моля, задайте такъв за production среда!',
        );
      }
    }
  }

  /**
   * Криптира данни с AES-256-GCM
   * @param plaintext Текстът, който трябва да бъде криптиран
   * @returns Криптирана стойност във формат: iv:authTag:криптиран_текст (base64)
   */
  encrypt(plaintext: string): string {
    try {
      // Генерираме случаен IV (Initialization Vector)
      const iv = crypto.randomBytes(this.ivLength);

      // Криптираме данните
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Обработваме данните
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      // Получаваме authentication tag (за GCM)
      const authTag = cipher.getAuthTag();

      // Връщаме резултата като base64 encoded стринг (iv:authTag:encrypted)
      return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    } catch (error) {
      console.error('Грешка при криптиране на данни:', error);
      throw new Error('Неуспешно криптиране на данни');
    }
  }

  /**
   * Декриптира данни с AES-256-GCM
   * @param encryptedData Криптираният текст във формат: iv:authTag:криптиран_текст (base64)
   * @returns Декриптираният текст
   */
  decrypt(encryptedData: string): string {
    try {
      // Декодираме base64 текста
      const buffer = Buffer.from(encryptedData, 'base64');

      // Извличаме IV, authTag и криптирания текст
      const iv = buffer.slice(0, this.ivLength);
      const authTag = buffer.slice(
        this.ivLength,
        this.ivLength + this.authTagLength,
      );
      const encrypted = buffer.slice(this.ivLength + this.authTagLength);

      // Създаваме decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Задаваме authentication tag
      decipher.setAuthTag(authTag);

      // Декриптираме данните
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      // Връщаме декриптирания текст
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Грешка при декриптиране на данни:', error);
      throw new Error(
        'Неуспешно декриптиране на данни. Данните може да са били подправени.',
      );
    }
  }

  /**
   * Генерира хеш на стойност
   * @param value Стойност за хеширане
   * @returns Хеширана стойност (SHA-256)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Сигурно сравнява два хеша без да разкрива времева информация (timing attacks)
   * @param hash1 Първи хеш
   * @param hash2 Втори хеш
   * @returns true ако хешовете съвпадат
   */
  compareHashes(hash1: string, hash2: string): boolean {
    // Използваме crypto.timingSafeEqual за да избегнем timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hash1, 'hex'),
        Buffer.from(hash2, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
