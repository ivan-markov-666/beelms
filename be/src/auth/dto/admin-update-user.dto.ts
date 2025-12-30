import { IsBoolean } from 'class-validator';
import { IsIn, IsOptional } from 'class-validator';
import { USER_ROLES, type UserRole } from '../user-role';

export class AdminUpdateUserDto {
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsIn(USER_ROLES)
  @IsOptional()
  role?: UserRole;
}
