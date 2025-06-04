import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import * as mime from 'mime-types';
import * as crypto from 'crypto';
import { MulterFile } from '../interfaces/multer-file.interface';

/**
 * Сервис за безопасно качване на файлове
 * Осигурява валидация на размер, тип и съдържание на файловете
 */
@Injectable()
export class SecureFileUploadService {
  private readonly logger = new Logger(SecureFileUploadService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor() {
    // Инициализация на директорията за качване на файлове
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    // Максимален размер на файловете (10MB по подразбиране)
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
    // Разрешени MIME типове
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // Създаване на директорията, ако не съществува
    void this.ensureUploadDirExists();
  }

  /**
   * Проверява дали директорията съществува и я създава ако не
   */
  private async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Използваме underscore за неизползваните параметри за да избегнем линт грешки
      this.logger.error(
        `Error creating upload directory: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Валидира файл по размер и тип
   */
  private validateFile(file: MulterFile): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Файлът е твърде голям. Максималният разрешен размер е ${
          this.maxFileSize / 1024 / 1024
        } MB`,
      );
    }

    // Проверка на MIME типа
    const mimeType = file.mimetype;
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Неразрешен тип файл. Разрешените типове са: ${this.allowedMimeTypes.join(
          ', ',
        )}`,
      );
    }
  }

  /**
   * Проверява дали файлът е изпълним
   */
  private isExecutable(file: MulterFile): boolean {
    if (!file) {
      throw new BadRequestException('Не е предоставен файл');
    }

    // Черен списък на разширения на изпълними файлове
    const extensionBlacklist = [
      '.exe',
      '.bat',
      '.cmd',
      '.sh',
      '.php',
      '.jar',
      '.js',
    ];

    const actualExtension = `.${extname(file.originalname)
      .toLowerCase()
      .replace(/^\./, '')}`;
    return extensionBlacklist.includes(actualExtension);
  }

  /**
   * Качва файл с безопасно име и проверки за сигурност
   * @param file Файлът за качване
   * @returns Името на записания файл
   */
  async uploadFile(file: MulterFile): Promise<string> {
    if (!file) {
      throw new BadRequestException('Не е предоставен файл');
    }

    this.validateFile(file);

    if (this.isExecutable(file)) {
      throw new ForbiddenException('Изпълнимите файлове не са разрешени');
    }

    // Extract file extension from MIME type or original filename
    let fileExtension = '';

    // First try to get extension from MIME type
    let mimeExtension: string | null = null;
    try {
      // Use type assertion to handle the mime.extension return type
      const mimeResult = mime as {
        extension: (mimeType: string) => string | null;
      };
      const ext = mimeResult.extension(file.mimetype);
      if (ext) {
        mimeExtension = ext;
        fileExtension = ext.toLowerCase();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Error determining MIME type for file: ${file.originalname || 'unknown'}`,
        errorMessage,
      );
    }

    // Fallback to extension from original filename if needed
    if (!fileExtension && file.originalname) {
      const ext = extname(file.originalname).toLowerCase();
      fileExtension = ext.startsWith('.') ? ext.slice(1) : ext;
    }

    // Log warning if we couldn't determine extension from MIME type
    if (!mimeExtension) {
      this.logger.warn(
        `Could not determine MIME type for file: ${file.originalname || 'unknown'}`,
      );
    }

    // Проверка в черния списък на разширения
    const extensionBlacklist = [
      '.exe',
      '.bat',
      '.cmd',
      '.sh',
      '.php',
      '.jar',
      '.js',
    ];

    const actualExtension = `.${fileExtension}`;
    if (extensionBlacklist.includes(actualExtension)) {
      throw new ForbiddenException(
        `Файлове с разширение ${actualExtension} не са разрешени`,
      );
    }

    // Генериране на случайно име за файла за предотвратяване на конфликти
    const fileName = `${crypto.randomUUID()}${
      fileExtension ? `.${fileExtension}` : ''
    }`;
    const filePath = join(this.uploadDir, fileName);

    // Запис на файла
    await fs.writeFile(filePath, file.buffer);
    this.logger.log(`Файлът е качен успешно: ${fileName}`);
    return fileName;
  }

  /**
   * Изтрива файл от определената директория със защита от path traversal
   * @param fileName Името на файла за изтриване
   */
  async deleteFile(fileName: string): Promise<void> {
    if (!fileName) {
      throw new BadRequestException('Не е предоставено име на файл');
    }

    // Защита срещу path traversal
    const normalizedFileName = fileName
      .replace(/^\.+/, '')
      .replace(/\/\\/g, '');
    const filePath = join(this.uploadDir, normalizedFileName);

    try {
      await fs.unlink(filePath);
      this.logger.log(`Файлът е изтрит успешно: ${normalizedFileName}`);
    } catch (error) {
      // Използваме underscore за неизползваните параметри за да избегнем линт грешки
      this.logger.error(`Error deleting file: ${(error as Error).message}`);
      throw new BadRequestException('Възникна грешка при изтриването на файла');
    }
  }
}
