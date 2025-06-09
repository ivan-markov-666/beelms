import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtPayload, RequestWithUser } from '../types/auth.types';
import { UserRole } from '../enums/user-role.enum';

// Type guard to check if a string is a valid UserRole
const isUserRole = (role: string): role is UserRole => {
  return ['user', 'admin', 'instructor'].includes(role);
};

/**
 * Middleware за JWT автентикация
 * Извлича и валидира JWT токена от заявките
 */
@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Check if the route is public
      const publicRoutes = ['/api/docs', '/health', '/'];
      const isPublicRoute = publicRoutes.some(
        (path: string) => req.originalUrl?.includes(path) || false,
      );

      if (isPublicRoute) {
        return next();
      }

      // Verify authorization header
      const authHeader = req.headers?.authorization;
      if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Липсва JWT токен');
      }

      // Extract and validate token
      const tokenParts = authHeader.split(' ');
      if (tokenParts.length !== 2) {
        throw new UnauthorizedException('Невалиден формат на токена');
      }

      const token = tokenParts[1];
      const payload = (await this.authService.verifyToken(token)) as JwtPayload;

      if (!payload) {
        throw new UnauthorizedException('Невалиден токен');
      }

      // Extract and validate user ID
      const userId = payload.sub || payload.userId;
      if (!userId) {
        throw new UnauthorizedException(
          'Липсва потребителски идентификатор в токена',
        );
      }

      // Process user roles with type safety
      const validRoles: UserRole[] = [];
      if (Array.isArray(payload.roles)) {
        // Process each role with type safety
        for (const role of payload.roles) {
          if (typeof role === 'string') {
            const normalizedRole = role.toLowerCase();
            if (isUserRole(normalizedRole)) {
              // Type assertion is safe here because isUserRole has already validated the type
              validRoles.push(normalizedRole);
            }
          }
        }
      }

      // Create a properly typed user object
      const user = {
        userId: String(userId),
        email: typeof payload.email === 'string' ? payload.email : '',
        roles: validRoles.slice(), // Create a mutable copy of the roles array
      };

      // Assign the user to the request
      req.user = user;

      next();
    } catch (error) {
      // Log the error for debugging
      console.error('JWT Auth Error:', error);
      throw new UnauthorizedException('Невалиден JWT токен');
    }
  }
}
