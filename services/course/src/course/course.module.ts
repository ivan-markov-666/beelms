import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { Content } from './entities/content.entity';
import { ContentVersion } from './entities/content-version.entity';
import { UserProgress } from './entities/user-progress.entity';
import { UserProgressStats } from './entities/user-progress-stats.entity';
import { MediaFile } from './entities/media-file.entity';
import { FileUploadController } from './controllers/file-upload.controller';
import { FileUploadService } from '../shared/services/file-upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Chapter,
      Content,
      ContentVersion,
      UserProgress,
      UserProgressStats,
      MediaFile,
    ]),
  ],
  controllers: [CourseController, FileUploadController],
  providers: [CourseService, FileUploadService],
  exports: [CourseService],
})
export class CourseModule {}
