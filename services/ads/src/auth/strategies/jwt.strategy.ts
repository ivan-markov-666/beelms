import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Define interfaces for JWT payload and user
interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

interface UserPayload {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'test-secret',
    });
  }

  validate(payload: JwtPayload): UserPayload {
    // Validate the JWT payload and return a user object
    // This user object will be attached to the request as req.user
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}
