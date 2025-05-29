import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Моля, въведете валиден имейл адрес' })
  email: string;

  @IsNotEmpty({ message: 'Паролата е задължителна' })
  password: string;
}
