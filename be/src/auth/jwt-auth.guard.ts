import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { User } from './user.entity';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();

    const rawAuthHeader =
      request.headers['authorization'] ?? request.headers['Authorization'];

    if (typeof rawAuthHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = rawAuthHeader.split(' ');

    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        tokenVersion: number;
      }>(token);

      const user = await this.usersRepo.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.active || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.user = {
        userId: user.id,
        email: user.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
