import { IsNotEmpty, IsNumber } from 'class-validator';

export class StartTestAttemptDto {
  @IsNotEmpty()
  @IsNumber()
  test_id: number;

  @IsNotEmpty()
  @IsNumber()
  user_id: number;
}
