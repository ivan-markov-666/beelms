import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';

export class UpdateContentDto {
  @ApiProperty({
    description: 'Заглавие на съдържанието',
    example: 'Въведение в променливите',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Съдържание',
    example: 'В програмирането, променливите са...',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Тип на съдържанието',
    example: 'text',
    required: false,
  })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiProperty({
    description: 'Пореден номер на съдържанието в главата',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Поредният номер трябва да бъде положително число' })
  order?: number;

  @ApiProperty({
    description: 'Описание на промените в съдържанието',
    example: 'Поправени правописни грешки',
    required: false,
  })
  @IsString()
  @IsOptional()
  changeDescription?: string;

  @ApiProperty({
    description: 'Дали съдържанието е публикувано',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Версия на съдържанието',
    example: 2,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Версията трябва да бъде положително число' })
  version?: number;
}
