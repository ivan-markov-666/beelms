import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import * as mime from 'mime-types';
import * as crypto from 'crypto';
import { MulterFile } from '../interfaces/express.interface';

@Injectable()
export class SecureFileUploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    // Използваме void оператор, за да означим че нямаме нужда да чакаме резултата
    void this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
      // Директорията съществува
    } catch {
      // Създаване на директорията, ако не съществува
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Проверява дали файл е безопасен за качване
   */
  private validateFile(file: MulterFile): void {
    // Проверка на размера на файла
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Файлът е твърде голям. Максимален размер: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Проверка на MIME типа
    const detectedMimeType = mime.lookup(file.originalname) || file.mimetype;
    if (!this.allowedMimeTypes.includes(detectedMimeType)) {
      throw new ForbiddenException(
        `Неподдържан тип файл. Разрешени типове: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Проверка за съвпадение на MIME тип с реалното съдържание
    if (detectedMimeType !== file.mimetype) {
      throw new ForbiddenException(
        'Несъответствие между разширение на файла и съдържание',
      );
    }

    // Допълнителна проверка за изпълними файлове
    if (file.originalname.match(/\.(exe|sh|bat|cmd|php|pl|py|rb|js)$/i)) {
      throw new ForbiddenException('Изпълнимите файлове не са разрешени');
    }
  }

  private isExecutable(file: MulterFile): boolean {
    if (!file) {
      throw new BadRequestException('Не е предоставен файл');
    }
    this.validateFile(file);

    const extensionBlacklist = [
      '.exe',
      '.bat',
      '.cmd',
      '.sh',
      '.php',
      '.jar',
      '.js',
    ];

    const actualExtension = `.${extname(file.originalname).toLowerCase().replace(/^\./, '')}`;
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

    if (this.isExecutable(file)) {
      throw new ForbiddenException('Изпълнимите файлове не са разрешени');
    }

    let fileExtension: string;
    try {
      fileExtension = mime.extension(file.mimetype) || '';
    } catch {
      fileExtension = extname(file.originalname).toLowerCase().replace(/^\./, '');
    }

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

    const fileName = `${crypto.randomUUID()}${fileExtension ? `.${fileExtension}` : ''}`;
    const filePath = join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);
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
    // Предпазване от Path Traversal атака
    const filePath = join(this.uploadDir, fileName);
    if (!filePath.startsWith(this.uploadDir)) {
      throw new ForbiddenException('Невалиден път до файл');
    }

    try {
      await fs.unlink(filePath);
    } catch {
      throw new BadRequestException(
        'Файлът не съществува или не може да бъде изтрит',
      );
    }
  }
}
