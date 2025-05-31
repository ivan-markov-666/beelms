import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = request.user as { id: number; email: string; role: UserRole };
    return Boolean(user && user.role === UserRole.ADMIN);
  }
}
