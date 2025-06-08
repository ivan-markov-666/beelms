import { Module } from '@nestjs/common';
import { RequestLoggerService } from '../services/request-logger.service';

@Module({
  providers: [RequestLoggerService],
  exports: [RequestLoggerService],
})
export class RequestLoggingModule {}
