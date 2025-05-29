import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Моля, въведете валиден имейл адрес' })
  email: string;

  @IsNotEmpty({ message: 'Паролата е задължителна' })
  @MinLength(8, { message: 'Паролата трябва да бъде поне 8 символа' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Паролата трябва да съдържа главна буква, малка буква и цифра/специален символ',
  })
  password: string;
}
