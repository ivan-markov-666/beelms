import { IsString, MinLength } from 'class-validator';

export class Enable2faDto {
  @IsString()
  secret: string;

  @IsString()
  @MinLength(6)
  code: string;
}
