import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainingService {
  ping(): { message: string; timestamp: string } {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }

  echo(value: unknown): {
    value: unknown;
    receivedAt: string;
    requestId: string;
  } {
    return {
      value,
      receivedAt: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
