import { Request as ExpressRequest } from 'express';
import { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  sub?: string | number;
  userId?: string | number;
  email?: string;
  roles?: UserRole[];
  [key: string]: unknown;
}

export interface AuthUser {
  userId: string;
  email: string;
  roles: UserRole[];
}

export interface RequestWithUser extends ExpressRequest {
  user?: AuthUser;
  originalUrl: string;
  headers: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
  };
}

// Extend the Express Request type to include our user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
