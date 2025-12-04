import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainingService {
  ping(): { status: string } {
    return { status: 'ok' };
  }

  // Echoes back whatever body was sent. This is useful for API exercises
  // where the client needs to verify request/response handling.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echo(body: any): any {
    return body;
  }
}
