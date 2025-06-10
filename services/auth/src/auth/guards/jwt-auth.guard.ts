import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // List of paths that don't require authentication
  private readonly publicPaths = [
    '/auth/register',
    '/auth/login',
    '/auth/reset-password-request',
    '/auth/reset-password',
    '/auth/health'
  ];

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    
    // Allow access to public paths without authentication
    if (this.publicPaths.includes(path)) {
      return true;
    }
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw err || new UnauthorizedException('Не сте оторизиран');
    }
    return user;
  }
}
