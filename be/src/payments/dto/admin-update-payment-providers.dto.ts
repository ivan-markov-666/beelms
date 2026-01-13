import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class AdminUpdatePaymentProvidersDto {
  @IsOptional()
  @IsBoolean()
  paymentsStripe?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsPaypal?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsMypos?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsRevolut?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['stripe', 'paypal', 'mypos', 'revolut'])
  paymentsDefaultProvider?: 'stripe' | 'paypal' | 'mypos' | 'revolut';
}
