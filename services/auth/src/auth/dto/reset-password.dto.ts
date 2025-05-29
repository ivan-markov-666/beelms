import { IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token received via email',
    required: true,
  })
  @IsNotEmpty({ message: 'Токенът е задължителен' })
  token: string;

  @ApiProperty({
    example: 'NewSecurePass123!',
    description:
      'New password. Must be at least 8 characters long and contain at ' +
      'least one uppercase letter, one lowercase letter, and one number or special character.',
    required: true,
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Новата парола е задължителна' })
  @MinLength(8, { message: 'Паролата трябва да бъде поне 8 символа' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Паролата трябва да съдържа главна буква, малка буква и цифра/специален символ',
  })
  newPassword: string;
}
