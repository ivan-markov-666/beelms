import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Req,
  ParseIntPipe,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CourseService } from '../course.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../../shared/interfaces/request.interface';
import { MulterFile } from '../../shared/interfaces/multer-file.interface';

/**
 * Type for media file types
 */
type MediaFileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'ATTACHMENT';

/**
 * Interface for file upload result
 */
interface FileUploadResult {
  id: number;
  url: string;
  filename: string;
  type: MediaFileType;
}

/**
 * Interface for file deletion result
 */
interface FileDeleteResult {
  success: boolean;
  message: string;
}

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileUploadController {
  private readonly logger = new Logger(FileUploadController.name);

  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly courseService: CourseService,
  ) {}

  /**
   * Type guard to check if an unknown object is a MulterFile
   * @param file - The file to check
   * @returns True if the file matches the MulterFile interface
   */
  private isMulterFile(file: unknown): file is MulterFile {
    // If file is not an object or is null, it's not a MulterFile
    if (typeof file !== 'object' || file === null) {
      return false;
    }

    // Check if the object has all required properties of MulterFile with expected types
    const obj = file as Record<string, unknown>;
    const hasRequiredProps =
      typeof obj.fieldname === 'string' &&
      typeof obj.originalname === 'string' &&
      typeof obj.encoding === 'string' &&
      typeof obj.mimetype === 'string' &&
      typeof obj.size === 'number';

    const hasOptionalProps =
      (typeof obj.destination === 'string' || obj.destination === undefined) &&
      (typeof obj.filename === 'string' || obj.filename === undefined) &&
      (typeof obj.path === 'string' || obj.path === undefined) &&
      (obj.buffer instanceof Buffer || obj.buffer === undefined);

    return hasRequiredProps && hasOptionalProps;
  }

  /**
   * Validates and safely casts the unknown uploaded file to MulterFile type
   * @param file - The uploaded file to validate
   * @returns The validated file as MulterFile or throws an exception
   * @throws BadRequestException if the file is not valid
   */
  private validateFile(file: unknown): MulterFile {
    // Ensure we have a non-null object
    if (typeof file !== 'object' || file === null) {
      throw new BadRequestException('Невалиден файл формат');
    }

    // Verify file is a MulterFile using the type guard first
    if (!this.isMulterFile(file)) {
      throw new BadRequestException('Невалиден файл формат');
    }

    // At this point, TypeScript knows file is a MulterFile
    // We can safely return it as it's already type-checked by isMulterFile
    return file;
  }

  @Post('upload/content/:contentId')
  @ApiOperation({ summary: 'Качване на файл към съдържание на курс' })
  @ApiParam({ name: 'contentId', description: 'ID на съдържанието' })
  @ApiResponse({ status: 201, description: 'Файлът е качен успешно' })
  @ApiResponse({ status: 400, description: 'Невалидни данни' })
  @ApiResponse({
    status: 403,
    description: 'Нямате достъп до тази функционалност',
  })
  @ApiResponse({ status: 500, description: 'Вътрешна грешка на сървъра' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadContentFile(
    @Param('contentId', ParseIntPipe) contentId: number,
    @UploadedFile() uploadedFile: unknown,
    @Req() req: RequestWithUser,
  ): Promise<FileUploadResult> {
    try {
      // Validate user access using helper method
      this.validateUserAccess(req);

      // Validate file exists
      if (!uploadedFile) {
        throw new BadRequestException('Файлът е задължителен');
      }

      // Validate file format using type guard
      if (!this.isMulterFile(uploadedFile)) {
        throw new BadRequestException('Невалиден формат на файла');
      }

      // Get properly typed file object
      const file = this.validateFile(uploadedFile);

      // Check if content exists
      const content = await this.courseService.getContentById(contentId);
      if (!content) {
        throw new BadRequestException('Съдържанието не е намерено');
      }

      // Upload file and get metadata
      const fileMetadata = await this.fileUploadService.uploadFile(
        file,
        'content',
      );

      // File is now verified as MulterFile, so mimetype access is safe
      const fileType = this.determineFileType(file.mimetype);

      // Associate file with content - at this point file is a verified MulterFile
      // so we can safely access its properties
      const mediaFile = await this.courseService.addMediaFileToContent(
        contentId,
        {
          originalName: file.originalname,
          filename: fileMetadata.filename,
          path: fileMetadata.url,
          size: file.size,
          mimeType: file.mimetype,
          type: fileType,
        },
      );

      // Return file upload result
      return {
        id: mediaFile.id,
        url: fileMetadata.url,
        filename: fileMetadata.filename,
        type: fileType,
      };
    } catch (error: unknown) {
      // Handle known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Log other errors and throw internal server error
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.logger.error(`Error uploading file: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Грешка при обработката на файла');
    }
  }

  @Delete(':contentId/media/:mediaId')
  @ApiOperation({ summary: 'Delete media file from content' })
  @ApiParam({
    name: 'contentId',
    description: 'Content ID the file is attached to',
  })
  @ApiParam({
    name: 'mediaId',
    description: 'Media file ID to delete',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteContentFile(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req: RequestWithUser,
  ): Promise<FileDeleteResult> {
    try {
      // Verify the user object exists and has a roles property
      if (!req.user || !req.user.roles) {
        throw new ForbiddenException('Не сте оторизиран потребител');
      }

      // Verify user has proper permissions (instructor or admin)
      const isAdmin: boolean = req.user.roles.includes('admin');
      const isInstructor: boolean = req.user.roles.includes('instructor');

      if (!isAdmin && !isInstructor) {
        throw new ForbiddenException('Нямате достъп до тази функционалност');
      }

      // Get media file
      const mediaFile = await this.courseService.getMediaFileById(mediaId);
      if (!mediaFile || mediaFile.contentId !== contentId) {
        throw new BadRequestException(
          'Файлът не е намерен или не принадлежи на това съдържание',
        );
      }

      // Delete the file and its record
      await this.fileUploadService.deleteFile(mediaFile.path);
      await this.courseService.deleteMediaFile(mediaId);

      return {
        success: true,
        message: 'Файлът е изтрит успешно',
      };
    } catch (error: unknown) {
      // Handle known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Safe to log error details after type checking
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.logger.error(`Error deleting file: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Грешка при изтриването на файла');
    }
  }

  /**
   * Helper method to validate user access for file operations
   * @param req - The request with user information
   * @throws ForbiddenException if user doesn't have required roles
   */
  private validateUserAccess(req: RequestWithUser): void {
    if (!req.user || !req.user.roles) {
      throw new ForbiddenException('Не сте оторизиран потребител');
    }

    const isAdmin = req.user.roles.includes('admin');
    const isInstructor = req.user.roles.includes('instructor');

    if (!isAdmin && !isInstructor) {
      throw new ForbiddenException('Нямате достъп до тази функционалност');
    }
  }

  /**
   * Helper method to determine file type based on MIME type
   * @param mimetype - The MIME type of the file
   * @returns The determined MediaFileType
   */
  private determineFileType(mimetype: string): MediaFileType {
    if (mimetype.startsWith('image')) {
      return 'IMAGE';
    } else if (mimetype.startsWith('video')) {
      return 'VIDEO';
    } else if (mimetype.includes('pdf') || mimetype.includes('doc')) {
      return 'DOCUMENT';
    }
    return 'ATTACHMENT';
  }
}
