import { IsBoolean } from 'class-validator';

export class AdminUpdateUserDto {
  @IsBoolean()
  active: boolean;
}
