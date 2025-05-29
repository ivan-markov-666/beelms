import { IsEmail } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsEmail({}, { message: 'Моля, въведете валиден имейл адрес' })
  email: string;
}
