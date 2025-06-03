import { Request } from 'express';

/**
 * Разширение на стандартния Request тип, който включва информация за аутентикирания потребител
 */
export interface RequestWithUser extends Request {
  user: {
    id: number;
    username?: string;
    email?: string;
    roles?: string[];
  };
}
