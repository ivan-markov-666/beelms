import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Tokens } from './interfaces/tokens.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Генерира двойка от access и refresh токени за даден потребител
   * @param userId ID на потребителя
   * @param username Потребителско име
   * @param email Email на потребителя
   * @param roles Роли на потребителя
   * @returns Tokens обект съдържащ access и refresh токени
   */
  async generateTokens(
    userId: number,
    username: string,
    email: string,
    roles: string[],
  ): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      // Генериране на access токен (кратък живот)
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          email,
          roles,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
        },
      ),
      // Генериране на refresh токен (по-дълъг живот)
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          email,
        },
        {
          secret: 
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Проверява валидността на refresh токена и генерира нови токени
   * @param refreshToken Refresh токенът за валидация
   * @returns Нова двойка токени
   * @throws UnauthorizedException при невалиден refresh токен
   */
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      // Верифициране на refresh токена
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        username: string;
        email: string;
        roles?: string[];
      }>(refreshToken, {
        secret: 
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
      });

      // Проверка за необходимите полета в токена
      if (!payload || !payload.sub || !payload.username || !payload.email) {
        throw new UnauthorizedException('Невалиден refresh токен');
      }

      // Генериране на нови токени
      // Тук може да се добави допълнителна проверка дали токенът не е в blacklist
      return this.generateTokens(
        payload.sub,
        payload.username,
        payload.email,
        payload.roles || [],
      );
    } catch {
      throw new UnauthorizedException('Невалиден или изтекъл refresh токен');
    }
  }
}
