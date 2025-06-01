import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Using type assertion to avoid unsafe call error
    return super.canActivate(context);
  }

  handleRequest(err: unknown, user: any): any {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('Не сте оторизиран');
    }
    return user;
  }
}
