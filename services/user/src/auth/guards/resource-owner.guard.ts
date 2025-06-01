import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';

/**
 * Guard для проверки владельца ресурса
 * Позволяет пользователю получить доступ только к своим ресурсам
 * Админы имеют доступ к любым ресурсам
 */
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Define request type to improve type safety
    interface RequestWithUser {
      user?: { id: number; role: UserRole };
      params: { id: string };
    }

    // Get the request object with proper typing
    const request: RequestWithUser = context.switchToHttp().getRequest();

    // Get user from the request
    const user = request.user;

    // Check if user exists to avoid unsafe member access
    if (!user) {
      return false;
    }

    // Parse the resource ID from params
    const resourceId = parseInt(request.params.id, 10);

    // User existence already checked above

    // Администраторы имеют доступ ко всем ресурсам
    // Check if user is an admin
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Для обычных пользователей - только к своим ресурсам
    // Check if user owns the resource
    if (user.id === resourceId) {
      return true;
    }

    throw new ForbiddenException(
      'У вас нет прав доступа к этому ресурсу. Вы можете получить доступ только к своим данным.',
    );
  }
}
