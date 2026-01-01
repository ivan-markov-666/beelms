import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type SocialProvider = 'google' | 'facebook' | 'github';

export interface SocialStatePayload {
  provider: SocialProvider;
  redirectPath: string;
}

@Injectable()
export class SocialOAuthStateService {
  private readonly secret: string;

  constructor(private readonly jwtService: JwtService) {
    this.secret = process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me';
  }

  createState(payload: SocialStatePayload): string {
    return this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: '5m',
    });
  }

  verifyState(state: string): SocialStatePayload {
    try {
      return this.jwtService.verify<SocialStatePayload>(state, {
        secret: this.secret,
      });
    } catch {
      throw new BadRequestException('invalid or expired oauth state');
    }
  }
}
