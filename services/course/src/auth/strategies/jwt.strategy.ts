import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET не е конфигуриран');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload): {
    id: number;
    username: string;
    roles: string[];
  } {
    if (!payload) {
      throw new UnauthorizedException('Невалиден токен');
    }

    // Тук можем да добавим допълнителна валидация или да извличаме
    // информация за потребителя от базата данни, ако е необходимо
    return {
      id: payload.userId,
      username: payload.email,
      roles: payload.roles || [],
    };
  }
}
