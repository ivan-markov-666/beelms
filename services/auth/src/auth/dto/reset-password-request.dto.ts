import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send the password reset link to',
    required: true,
  })
  @IsEmail({}, { message: 'Моля, въведете валиден имейл адрес' })
  email: string;
}
