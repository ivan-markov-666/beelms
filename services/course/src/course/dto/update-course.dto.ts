import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({
    description: 'Заглавие на курса',
    example: 'Въведение в програмирането с JavaScript',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Описание на курса',
    example:
      'Този курс ще ви запознае с основите на JavaScript програмирането...',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL към изображението на корицата на курса',
    example: 'https://example.com/images/js-course-cover.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Дали курсът е активен',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Допълнителни мета данни за курса',
    example: { level: 'beginner', tags: ['javascript', 'programming'] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
