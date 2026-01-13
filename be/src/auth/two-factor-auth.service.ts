import { Injectable } from '@nestjs/common';
import {
  buildOtpAuthUrl,
  generateTwoFactorSecret,
  verifyTotp,
} from './totp.util';
import {
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
} from './two-factor-crypto.util';

@Injectable()
export class TwoFactorAuthService {
  generateSecret(): string {
    return generateTwoFactorSecret();
  }

  buildOtpAuthUrl(params: {
    issuer: string;
    email: string;
    secret: string;
  }): string {
    return buildOtpAuthUrl(params);
  }

  encryptSecret(secret: string): string {
    return encryptTwoFactorSecret(secret);
  }

  decryptSecret(encrypted: string): string {
    return decryptTwoFactorSecret(encrypted);
  }

  verifyCode(params: { code: string; secret: string }): boolean {
    return verifyTotp({ token: params.code, secret: params.secret, window: 1 });
  }
}
