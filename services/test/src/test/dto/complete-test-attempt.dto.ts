import { IsNotEmpty, IsNumber } from 'class-validator';

export class CompleteTestAttemptDto {
  @IsNotEmpty()
  @IsNumber()
  attempt_id: number;
}
