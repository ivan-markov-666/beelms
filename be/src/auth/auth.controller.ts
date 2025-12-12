import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { AuthTokenDto } from './dto/auth-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RateLimit } from '../security/rate-limit/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @RateLimit({ limit: 5, windowSeconds: 3600, key: 'ip' })
  register(@Body() dto: RegisterDto): Promise<UserProfileDto> {
    return this.authService.register(dto);
  }

  @HttpCode(200)
  @Post('login')
  @RateLimit({ limit: 10, windowSeconds: 60, key: 'ip+email' })
  login(@Body() dto: LoginDto): Promise<AuthTokenDto> {
    return this.authService.login(dto);
  }

  @HttpCode(200)
  @Post('forgot-password')
  @RateLimit({ limit: 5, windowSeconds: 3600, key: 'ip' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(200)
  @Post('reset-password')
  @RateLimit({ limit: 10, windowSeconds: 3600, key: 'ip' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(200)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    return this.authService.verifyEmail(dto);
  }
}
