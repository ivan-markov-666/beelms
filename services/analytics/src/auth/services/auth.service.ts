import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../interfaces/user.interface';
import { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Невалиден JWT токен');
    }
  }

  hasRequiredRoles(user: User, requiredRoles: UserRole[]): boolean {
    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }
    return requiredRoles.some((role) => user.roles.includes(role));
  }

  enrichUserWithRoles(user: User): User {
    return user;
  }
}
