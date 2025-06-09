import { UserRole } from '../enums/user-role.enum';

/**
 * Интерфейс, дефиниращ структурата на потребителските данни
 * в рамките на аналитичния микросервис
 */
export interface User {
  userId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}
