import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Име на потребителя', example: 'Иван' })
  @IsNotEmpty({ message: 'Името е задължително' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Фамилия на потребителя', example: 'Петров' })
  @IsNotEmpty({ message: 'Фамилията е задължителна' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Имейл адрес',
    example: 'ivan.petrov@example.com',
  })
  @IsNotEmpty({ message: 'Имейлът е задължителен' })
  @IsEmail({}, { message: 'Невалиден имейл адрес' })
  email: string;

  @ApiProperty({
    description: 'Телефонен номер',
    example: '+359888123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Парола', minLength: 8 })
  @IsNotEmpty({ message: 'Паролата е задължителна' })
  @MinLength(8, { message: 'Паролата трябва да е поне 8 символа' })
  password: string;

  @ApiProperty({ description: 'Адрес', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
