import { BadRequestException, Injectable } from '@nestjs/common';

type CaptchaVerifyResult = {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  ['error-codes']?: string[];
};

@Injectable()
export class CaptchaService {
  private readonly timeoutMs = 3000;

  async verifyCaptchaToken(args: {
    token: string;
    remoteIp?: string;
  }): Promise<void> {
    if (
      process.env.NODE_ENV === 'test' &&
      args.token === 'test-captcha-token'
    ) {
      return;
    }

    if (!args.token || args.token.trim().length === 0) {
      throw new BadRequestException('captcha verification required');
    }

    if (process.env.CAPTCHA_VERIFY_DISABLED === 'true') {
      return;
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret || secret.trim().length === 0) {
      throw new BadRequestException('captcha verification failed');
    }

    const controller = new AbortController();
    const handle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const body = new URLSearchParams();
      body.set('secret', secret);
      body.set('response', args.token);
      if (args.remoteIp && args.remoteIp.trim().length > 0) {
        body.set('remoteip', args.remoteIp.trim());
      }

      const res = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        throw new BadRequestException('captcha verification failed');
      }

      const data = (await res.json()) as CaptchaVerifyResult;

      if (!data?.success) {
        throw new BadRequestException('captcha verification failed');
      }
    } catch {
      throw new BadRequestException('captcha verification failed');
    } finally {
      clearTimeout(handle);
    }
  }
}
