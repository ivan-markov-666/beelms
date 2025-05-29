import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address",
    required: true,
  })
  @IsEmail({}, { message: 'Моля, въведете валиден имейл адрес' })
  email: string;

  @ApiProperty({
    example: 'yourSecurePassword123!',
    description: "User's password",
    required: true,
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Паролата е задължителна' })
  password: string;
}
