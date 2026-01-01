import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

// Restrict emails to ASCII characters; ESLint warns about control ranges by default.
// eslint-disable-next-line no-control-regex
const ASCII_EMAIL_REGEX = /^[\u{0000}-\u{007F}]*$/u;

export class RegisterDto {
  @IsEmail({ allow_utf8_local_part: false })
  @Matches(ASCII_EMAIL_REGEX, {
    message: 'Email must contain only ASCII characters',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).{8,100}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
    },
  )
  password: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;

  @IsBoolean()
  acceptTerms: boolean;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
