import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateContentDto {
  @ApiProperty({
    description: 'ID на главата, към която принадлежи съдържанието',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'ID на главата трябва да бъде положително число' })
  chapterId: number;

  @ApiProperty({
    description: 'Заглавие на съдържанието',
    example: 'Въведение в променливите',
  })
  @IsString()
  @IsNotEmpty({ message: 'Заглавието е задължително' })
  title: string;

  @ApiProperty({
    description: 'Съдържание',
    example: 'В програмирането, променливите са...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Съдържанието е задължително' })
  content: string;

  @ApiProperty({
    description: 'Тип на съдържанието',
    example: 'text',
  })
  @IsString()
  @IsNotEmpty({ message: 'Типът на съдържанието е задължителен' })
  contentType: string;

  @ApiProperty({
    description: 'Пореден номер на съдържанието в главата',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Поредният номер трябва да бъде положително число' })
  order: number;

  @ApiProperty({
    description: 'Дали съдържанието е публикувано',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({
    description: 'ID на потребителя, който създава съдържанието',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  createdBy?: number;

  @ApiProperty({
    description: 'Описание на промените в съдържанието',
    example: 'Първоначално създаване',
    required: false,
  })
  @IsString()
  @IsOptional()
  changeDescription?: string;
}
