import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Define the interface for Express.Multer.File to avoid using 'any'
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

export interface FileMetadata {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
  url: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  ];
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB max file size

  constructor() {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: MulterFile,
    subFolder = 'content',
  ): Promise<FileMetadata> {
    try {
      // Validate file
      this.validateFile(file);

      // Create year/month based subfolders for better organization
      const date = new Date();
      const yearMonth = `${date.getFullYear()}/${date.getMonth() + 1}`;
      const uploadPath = path.join(this.uploadDir, subFolder, yearMonth);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Generate unique filename
      const extension = path.extname(file.originalname).toLowerCase();
      const randomName = crypto.randomBytes(16).toString('hex');
      const filename = `${randomName}${extension}`;
      const filePath = path.join(uploadPath, filename);

      // Save the file
      await fs.promises.writeFile(filePath, file.buffer);

      // Generate relative path for URL
      const relativePath = path
        .join(subFolder, yearMonth, filename)
        .replace(/\\/g, '/');

      return {
        originalName: file.originalname,
        filename,
        path: filePath,
        size: file.size,
        mimeType: file.mimetype,
        extension: extension.substring(1), // Remove the dot
        url: `/uploads/${relativePath}`,
      };
    } catch (error) {
      this.logger.error(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : '',
      );
      if (error instanceof UnsupportedMediaTypeException) {
        throw error;
      }
      throw new InternalServerErrorException('Качването на файла се провали');
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Ensure the path is within the uploads directory
      const normalizedPath = path.normalize(filePath);
      const absolutePath = path.isAbsolute(normalizedPath)
        ? normalizedPath
        : path.join(this.uploadDir, normalizedPath);

      // Security check to prevent directory traversal
      if (!absolutePath.startsWith(this.uploadDir)) {
        throw new InternalServerErrorException('Невалиден път за изтриване');
      }

      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(
        `File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException('Изтриването на файла се провали');
    }
  }

  private validateFile(file: MulterFile): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new UnsupportedMediaTypeException(
        `Файлът е твърде голям. Максималният размер е ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new UnsupportedMediaTypeException(
        `Неподдържан тип файл. Поддържаните типове са: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }
}
