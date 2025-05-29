import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address",
    required: true,
  })
  @IsEmail({}, { message: 'Моля, въведете валиден имейл адрес' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description:
      "User's password. Must be at least 8 characters long and contain at " +
      'least one uppercase letter, one lowercase letter, and one number or special character.',
    required: true,
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Паролата е задължителна' })
  @MinLength(8, { message: 'Паролата трябва да бъде поне 8 символа' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Паролата трябва да съдържа главна буква, малка буква и цифра/специален символ',
  })
  password: string;
}
