import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainingService {
  ping(): { status: string } {
    return { status: 'ok' };
  }

  // Echoes back whatever body was sent. This is useful for API exercises
  // where the client needs to verify request/response handling.

  echo<T>(body: T): T {
    return body;
  }
}
