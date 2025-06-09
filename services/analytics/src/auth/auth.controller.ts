import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PublicApi } from './decorators/public-api.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './interfaces/user.interface';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { RolesGuard } from './guards/roles.guard';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

/**
 * Контролер за демонстрация на JWT автентикация и ролево-базирана авторизация
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  /**
   * Публичен ендпойнт, достъпен без автентикация
   */
  @PublicApi()
  @Get('public')
  @ApiOperation({ summary: 'Публичен маршрут' })
  @ApiResponse({
    status: 200,
    description: 'Връща съобщение, че маршрутът е публичен',
  })
  publicRoute() {
    return {
      message: 'Това е публичен ендпойнт, достъпен без автентикация',
    };
  }

  /**
   * Защитен ендпойнт, изискващ JWT автентикация
   */
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Защитен маршрут, изискващ JWT автентикация' })
  @ApiResponse({
    status: 200,
    description: 'Връща информация за автентикирания потребител',
  })
  @ApiResponse({
    status: 401,
    description: 'Не е предоставена валидна JWT автентикация',
  })
  @ApiBearerAuth()
  protectedRoute(@CurrentUser() user: User) {
    return {
      message: 'Вие сте автентикирани успешно',
      user,
    };
  }

  /**
   * Ендпойнт за администратори, изискващ JWT автентикация и админ роля
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Маршрут само за администратори' })
  @ApiResponse({
    status: 200,
    description: 'Връща съобщение за администраторски достъп',
  })
  @ApiResponse({
    status: 401,
    description: 'Не е предоставена валидна JWT автентикация',
  })
  @ApiResponse({
    status: 403,
    description: 'Потребителят няма необходимите права за достъп',
  })
  @ApiBearerAuth()
  adminRoute(@CurrentUser() user: User) {
    return {
      message: 'Вие имате администраторски достъп',
      user,
    };
  }
}
