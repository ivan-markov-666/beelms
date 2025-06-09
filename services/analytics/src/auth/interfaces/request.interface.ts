import { Request } from 'express';
import { User } from './user.interface';

/**
 * Разширява Express.Request за да включи типизиран user обект
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}
