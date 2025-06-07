import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

type Encryptable = string | number | boolean | null | undefined;

/**
 * Сервиз за криптиране и декриптиране на чувствителни данни
 * Използва се за защита на лична информация съгласно GDPR и други изисквания
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm: string;
  private readonly secretKey: Buffer;
  private readonly ivLength: number;

  private readonly logger = new Logger(EncryptionService.name);

  constructor(private readonly configService: ConfigService) {
    this.algorithm = 'aes-256-cbc'; // Standard encryption algorithm
    this.ivLength = 16; // AES block size

    // Get key from config or generate a new one
    const configKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!configKey) {
      this.logger.warn(
        'ENCRYPTION_KEY is not configured! Generating a temporary encryption key. ' +
          'This is NOT safe for production!',
      );
    }

    // Generate cryptographically secure key or use the provided one
    this.secretKey = configKey
      ? Buffer.from(configKey, 'hex')
      : crypto.randomBytes(32); // 256 bits for AES-256
  }

  /**
   * Криптира чувствителни данни
   * @param text Текст за криптиране
   * @returns Криптиран текст с IV в base64 формат
   */
  encrypt(text: Encryptable): string {
    if (text === null || text === undefined || text === '') {
      return '';
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      const encrypted = Buffer.concat([
        cipher.update(String(text), 'utf8'),
        cipher.final(),
      ]);

      return Buffer.concat([iv, encrypted]).toString('base64');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Encryption error: ' + errorMessage,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Encryption failed');
    }
  }

  /**
   * Декриптира криптирани данни
   * @param encryptedText Криптиран текст (в base64 формат)
   * @returns Декриптирания оригинален текст
   */
  decrypt(encryptedText: Encryptable): string {
    if (
      !encryptedText ||
      typeof encryptedText !== 'string' ||
      encryptedText.trim() === ''
    ) {
      return '';
    }

    try {
      const buffer = Buffer.from(encryptedText, 'base64');
      if (buffer.length < this.ivLength) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = buffer.subarray(0, this.ivLength);
      const encrypted = buffer.subarray(this.ivLength);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        iv,
      );

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Decryption error: ' + errorMessage,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Decryption failed');
    }
  }

  /**
   * Криптира обект с чувствителни данни
   * @param data Обект с данни за криптиране
   * @param fieldsToEncrypt Масив с имената на полетата, които трябва да се криптират
   * @returns Обект с криптирани полета
   */
  encryptObject<T extends Record<string, unknown>>(
    data: T,
    fieldsToEncrypt: string[],
  ): T {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    const encryptedData = { ...data } as Record<string, unknown>;

    for (const field of fieldsToEncrypt) {
      const fieldValue = encryptedData[field];
      if (fieldValue === undefined || fieldValue === null) {
        continue;
      }

      try {
        let stringValue: string;

        if (fieldValue === null) {
          stringValue = 'null';
        } else if (typeof fieldValue === 'object') {
          try {
            stringValue = JSON.stringify(fieldValue);
          } catch (error) {
            if (error instanceof Error) {
              this.logger.error(
                `Failed to stringify field ${field}: ${error.message}`,
                error.stack,
              );
            } else {
              this.logger.error(`Failed to stringify field ${field}: ${error}`);
            }
            const typeName = fieldValue.constructor?.name || 'Object';
            stringValue = `[object ${typeName}]`;
          }
        } else if (typeof fieldValue === 'symbol') {
          stringValue = fieldValue.toString();
        } else if (
          typeof fieldValue === 'string' ||
          typeof fieldValue === 'number' ||
          typeof fieldValue === 'boolean'
        ) {
          stringValue = String(fieldValue);
        } else if (fieldValue !== undefined) {
          // This case implies fieldValue is not null, not an object, not a symbol,
          // not a string, not a number, not a boolean, but also not undefined.
          // This is a very narrow, unexpected case. Log a warning.
          this.logger.warn(
            `Unexpected type for fieldValue ('${typeof fieldValue}') ` +
              `when encrypting field '${field}'. Using placeholder string.`,
          );
          // For unhandled types that are not explicitly caught primitives or objects/symbols,
          // use a placeholder to avoid potential '[object Object]' and satisfy linter.
          stringValue = `[unhandled_type:${typeof fieldValue}]`;
        } else {
          stringValue = 'undefined';
        }

        encryptedData[field] = this.encrypt(stringValue);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to process field ${field} for encryption: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return encryptedData as T;
  }

  /**
   * Декриптира обект с криптирани данни
   * @param data Обект с криптирани данни
   * @param fieldsToDecrypt Масив с имената на полетата за декриптиране
   * @returns Обект с декриптирани полета
   */
  decryptObject<T extends Record<string, unknown>>(
    data: T,
    fieldsToDecrypt: string[],
  ): T {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    const result = { ...data };

    for (const field of fieldsToDecrypt) {
      const fieldValue = result[field as keyof T];
      if (fieldValue && typeof fieldValue === 'string') {
        try {
          const decryptedValue = this.decrypt(fieldValue);

          // Try to parse JSON if the decrypted value looks like JSON
          if (typeof decryptedValue === 'string') {
            const isJsonObject =
              decryptedValue.startsWith('{') && decryptedValue.endsWith('}');
            const isJsonArray =
              decryptedValue.startsWith('[') && decryptedValue.endsWith(']');

            try {
              result[field as keyof T] = (
                isJsonObject || isJsonArray
                  ? JSON.parse(decryptedValue)
                  : decryptedValue
              ) as T[keyof T];
            } catch {
              // If parsing fails, use the decrypted string as is
              result[field as keyof T] = decryptedValue as T[keyof T];
            }
          } else {
            result[field as keyof T] = decryptedValue as T[keyof T];
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Failed to decrypt field ${field}: ${errorMessage}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    }

    return result;
  }
}
