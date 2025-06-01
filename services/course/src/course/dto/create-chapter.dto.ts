import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({
    description: 'ID на курса, към който принадлежи главата',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'ID на курса трябва да бъде положително число' })
  courseId: number;

  @ApiProperty({
    description: 'Заглавие на главата',
    example: 'Променливи и типове данни',
  })
  @IsString()
  @IsNotEmpty({ message: 'Заглавието е задължително' })
  title: string;

  @ApiProperty({
    description: 'Описание на главата',
    example: 'В тази глава ще научите за различните типове данни в JavaScript...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Описанието е задължително' })
  description: string;

  @ApiProperty({
    description: 'Пореден номер на главата в курса',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Поредният номер трябва да бъде положително число' })
  order: number;
}
