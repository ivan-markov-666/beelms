import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY, 
      [context.getHandler(), context.getClass()]
    );
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) return false;
    
    // Cast user to any as the type may vary by auth implementation
    const userWithRoles = user as any;
    // Check if user has one of the required roles
    return requiredRoles.some((role) => 
      Array.isArray(userWithRoles.roles) && userWithRoles.roles.includes(role)
    );
  }
}
