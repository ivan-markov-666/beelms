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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({ description: 'Service is running', schema: { properties: { status: { type: 'string', example: 'ok' } } }})
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
  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse({
    description: 'User successfully logged in',
    schema: {
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        role: { type: 'string', example: 'user' },
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid credentials' })
  @ApiBody({ type: LoginDto })
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
  @ApiOperation({ summary: 'Request password reset' })
  @ApiOkResponse({
    description: 'If the email exists, a reset link will be sent',
    schema: {
      properties: {
        message: { 
          type: 'string', 
          example: 'Ако имейлът съществува, ще получите линк за рестартиране на паролата.' 
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bad Request - Invalid email format' })
  @ApiBody({ type: ResetPasswordRequestDto })
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
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiOkResponse({
    description: 'Password successfully reset',
    schema: {
      properties: {
        message: { 
          type: 'string', 
          example: 'Паролата беше успешно променена.' 
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bad Request - Invalid or expired token' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: 'Паролата беше успешно променена.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'User successfully logged out',
    schema: {
      properties: {
        message: { 
          type: 'string', 
          example: 'Успешно излизане от системата.' 
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  async logout(@Request() req: RequestWithUser) {
    const token = req.headers.authorization?.split(' ')[1] || '';
    await this.authService.logout(token);
    return {
      message: 'Успешно излизане от системата.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Returns the authenticated user profile',
    schema: {
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        role: { type: 'string', example: 'user' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  getProfile(@Request() req: RequestWithUser) {
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
