# Task 1.5.1: JWT Authentication

## 🎯 Цел

Имплементиране на JWT базирана автентикация за приложението.

## 🛠️ Действия

1. Създаване на JWT модул и стратегия
2. Имплементиране на вход и регистрация
3. Добавяне на refresh token функционалност
4. Имплементиране на защитени маршрути
5. Добавяне на Swagger документация

## 📋 Код

### Инсталиране на необходимите пакети

```bash
cd apps/api
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt @types/passport-jwt @types/bcrypt
```

### Конфигурация на JWT модула

```typescript
// apps/api/src/auth/jwt/jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [NestJwtModule],
})
export class JwtModule {}
```

### JWT стратегия за Passport

```typescript
// apps/api/src/auth/jwt/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
```

### Сервиз за автентикация

```typescript
// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '@qa-platform/shared-types';
import * as bcrypt from 'bcrypt';

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: User): Promise<Tokens> {
    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    return this.getTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
  }

  async register(email: string, password: string, name: string): Promise<Tokens> {
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(this.configService.get<string>('SALT_ROUNDS', '10')));

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
      roles: ['user'],
      isActive: true,
    });

    return this.getTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.getTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
  }

  private async getTokens(payload: JwtPayload): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // Хеширане на refresh token преди запис в базата
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(payload.sub, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    return this.usersService.updateRefreshToken(userId, null);
  }
}
```

### Контролер за автентикация

```typescript
// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokensResponseDto } from './dto/tokens-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokensResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(req.user);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: TokensResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(registerDto.email, registerDto.password, registerDto.name);

    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: TokensResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = req.user['sub'];
    const refreshToken = req.cookies?.Refresh || req.body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user['sub']);
    this.clearAuthCookies(res);
    return { message: 'Logout successful' };
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    res.cookie('Authentication', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('Refresh', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('Authentication');
    res.clearCookie('Refresh', { path: '/api/auth/refresh' });
  }
}
```

### Глобален Guard за защита на маршрути

```typescript
// apps/api/src/common/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Конфигурационни променливи

```env
# JWT
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
SALT_ROUNDS=10

# Cookies
COOKIE_SECRET=your_cookie_secret
```

## 📦 Deliverables

- [x] JWT базирана автентикация
- [x] Поддръжка на access и refresh токени
- [x] Защитени маршрути с JWT Guard
- [x] Swagger документация
- [ ] Интеграционни тестове
- [ ] Unit тестове за сървисите

## 🧪 Тестване

### Примерни заявки

1. **Вход**

   ```http
   POST /api/auth/login
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "yourpassword"
   }
   ```

2. **Регистрация**

   ```http
   POST /api/auth/register
   Content-Type: application/json

   {
     "email": "newuser@example.com",
     "password": "securepassword",
     "name": "John Doe"
   }
   ```

3. **Обновяване на токен**

   ```http
   POST /api/auth/refresh
   Cookie: Refresh=your_refresh_token
   ```

   или

   ```http
   POST /api/auth/refresh
   Content-Type: application/json

   {
     "refreshToken": "your_refresh_token"
   }
   ```

4. **Изход**
   ```http
   POST /api/auth/logout
   Authorization: Bearer your_access_token
   ```

## 📝 Бележки

- Access токенът има кратък живот (15 минути по подразбиране)
- Refresh токенът се използва за получаване на нов access токен
- Всички токени се изпращат като HTTP-only бисквитки за по-добра сигурност
- Добавете rate limiting за предотвратяване на brute force атаки
- Имплементирайте логика за изтичане на сесии и изтичане на токени
