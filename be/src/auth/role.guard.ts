import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  type Type,
  mixin,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import type { UserRole } from './user-role';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function RoleGuard(
  allowedRoles: readonly UserRole[],
): Type<CanActivate> {
  @Injectable()
  class RoleGuardMixin implements CanActivate {
    constructor(
      @InjectRepository(User)
      private readonly usersRepo: Repository<User>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const httpContext = context.switchToHttp();
      const request = httpContext.getRequest<AuthenticatedRequest>();

      if (!request.user?.userId) {
        throw new ForbiddenException('Role access required');
      }

      const user = await this.usersRepo.findOne({
        where: { id: request.user.userId, active: true },
      });

      if (!user) {
        throw new ForbiddenException('Role access required');
      }

      const isAllowed = allowedRoles.includes(user.role);
      if (!isAllowed) {
        throw new ForbiddenException('Role access required');
      }

      return true;
    }
  }

  return mixin(RoleGuardMixin);
}
