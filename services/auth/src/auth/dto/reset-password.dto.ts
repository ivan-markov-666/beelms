import { IsNotEmpty, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Токенът е задължителен' })
  token: string;

  @IsNotEmpty({ message: 'Новата парола е задължителна' })
  @MinLength(8, { message: 'Паролата трябва да бъде поне 8 символа' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Паролата трябва да съдържа главна буква, малка буква и цифра/специален символ',
  })
  newPassword: string;
}
