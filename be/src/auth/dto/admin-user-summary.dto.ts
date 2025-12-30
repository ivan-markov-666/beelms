import type { UserRole } from '../user-role';

export class AdminUserSummaryDto {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}
