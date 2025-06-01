import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateChapterDto {
  @ApiProperty({
    description: 'Заглавие на главата',
    example: 'Променливи и типове данни',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Описание на главата',
    example: 'В тази глава ще научите за различните типове данни в JavaScript...',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Пореден номер на главата в курса',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Поредният номер трябва да бъде положително число' })
  order?: number;
}
