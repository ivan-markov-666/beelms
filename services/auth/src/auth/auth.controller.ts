import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Дефиниция на интерфейс за Request с типизация
interface RequestWithUser {
  user: {
    id: number;
    email: string;
    role: string;
  };
  headers: {
    authorization?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { user, token } = await this.authService.register(registerDto);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      accessToken: token,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { user, token } = await this.authService.login(loginDto);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      accessToken: token,
    };
  }

  @Post('reset-password-request')
  @HttpCode(HttpStatus.OK)
  async resetPasswordRequest(
    @Body() resetPasswordRequestDto: ResetPasswordRequestDto,
  ) {
    await this.authService.resetPasswordRequest(resetPasswordRequestDto);
    return {
      message:
        'Ако имейлът съществува, ще получите линк за рестартиране на паролата.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: 'Паролата беше успешно променена.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: RequestWithUser) {
    const token = req.headers.authorization?.split(' ')[1] || '';
    await this.authService.logout(token);
    return {
      message: 'Успешно излизане от системата.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
