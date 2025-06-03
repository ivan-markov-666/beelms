import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface User {
  id: string;
  username: string;
  roles: string[];
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndMerge<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException(
        'Потребителят няма необходимите права за достъп',
      );
    }

    if (requiredRoles.some((role) => user.roles.includes(role))) {
      return true;
    }

    throw new ForbiddenException(
      'Потребителят няма необходимите права за достъп',
    );
  }
}
