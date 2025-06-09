import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export { UserRole };
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
