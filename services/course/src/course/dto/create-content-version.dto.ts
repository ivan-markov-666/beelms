import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateContentVersionDto {
  @ApiProperty({
    description: 'ID на съдържанието, към което се създава версия',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'ID на съдържанието трябва да бъде положително число' })
  contentId: number;

  @ApiProperty({
    description: 'Съдържание на версията',
    example: 'В програмирането, променливите са...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Съдържанието е задължително' })
  contentBody: string;

  @ApiProperty({
    description: 'Описание на промените в тази версия',
    example: 'Поправени правописни грешки',
    required: false,
  })
  @IsString()
  @IsOptional()
  changeDescription?: string;

  @ApiProperty({
    description: 'ID на потребителя, който създава версията',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  createdBy?: number;

  @ApiProperty({
    description: 'Номер на версията',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Номерът на версията трябва да бъде положително число' })
  versionNumber: number;
}
