import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Заглавие на курса',
    example: 'Въведение в програмирането с JavaScript',
  })
  @IsString()
  @IsNotEmpty({ message: 'Заглавието е задължително' })
  title: string;

  @ApiProperty({
    description: 'Описание на курса',
    example: 'Този курс ще ви запознае с основите на JavaScript програмирането...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Описанието е задължително' })
  description: string;

  @ApiProperty({
    description: 'URL към изображението на корицата на курса',
    example: 'https://example.com/images/js-course-cover.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Допълнителни метаданни за курса',
    example: { level: 'начинаещ', duration: '10 часа', tags: ['програмиране', 'javascript'] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Дали курсът е активен',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
