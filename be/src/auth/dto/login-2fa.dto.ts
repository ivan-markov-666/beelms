import { IsString, MinLength } from 'class-validator';

export class Login2faDto {
  @IsString()
  challengeToken: string;

  @IsString()
  @MinLength(6)
  code: string;
}
