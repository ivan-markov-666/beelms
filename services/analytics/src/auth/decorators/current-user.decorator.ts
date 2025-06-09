import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { User } from '../interfaces/user.interface';

/**
 * Декоратор, който извлича текущия потребител от заявката.
 * Използва се в контролерите за лесен достъп до данните на потребителя.
 *
 * Пример за използване:
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
