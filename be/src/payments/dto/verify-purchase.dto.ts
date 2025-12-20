import { IsString, MinLength } from 'class-validator';

export class VerifyPurchaseDto {
  @IsString()
  @MinLength(1)
  sessionId: string;
}
