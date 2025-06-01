import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход в системата' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Успешен вход. Връща JWT токени',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Невалидни потребителски данни или заключен акаунт',
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    // Извличаме IP адреса и User-Agent
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    // Валидираме потребителя
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
      ipAddress,
    );

    // Генерираме токени
    return this.authService.createTokens(user, ipAddress, userAgent);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Обновяване на access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Токенът е обновен успешно',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Невалиден или изтекъл refresh token',
  })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.authService.refreshAccessToken(
      refreshTokenDto.refresh_token,
      ipAddress,
      userAgent,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Изход от системата' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Успешен изход от системата',
  })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    // Предполагаме, че req.user ще бъде инжектиран от JwtAuthGuard
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user?.['id'] || req.user?.['sub'];
    const ipAddress = req.ip;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.authService.logout(userId, ipAddress);
    return { message: 'Успешен изход от системата' };
  }
}
