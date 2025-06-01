import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the tracking key for rate limiting
    // Add await to satisfy the async method requirement
    const ipAddress = req.ip as string;
    return await Promise.resolve(ipAddress);
  }
}
