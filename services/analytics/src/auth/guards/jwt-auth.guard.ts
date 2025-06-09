import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_API_KEY } from '../decorators/public-api.decorator';

/**
 * Guard за JWT автентикация
 * Проверява дали заявката съдържа валиден JWT токен
 * Поддържа изключения чрез декоратора @PublicApi()
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Проверяваме дали ендпойнтът е маркиран като публичен
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_API_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Ако ендпойнтът е публичен, пропускаме проверката за JWT
    if (isPublic) {
      return true;
    }

    // В противен случай извършваме JWT проверка
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any): any {
    // Ако има грешка или липсва потребител, хвърляме UnauthorizedException
    if (err || !user) {
      throw err || new UnauthorizedException('Не сте оторизиран');
    }
    return user;
  }
}
