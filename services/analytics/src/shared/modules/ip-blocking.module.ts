import { Module } from '@nestjs/common';
import { IpBlockingService } from '../services/ip-blocking.service';
import { IpBlockingController } from '../controllers/ip-blocking.controller';

@Module({
  providers: [IpBlockingService],
  controllers: [IpBlockingController],
  exports: [IpBlockingService],
})
export class IpBlockingModule {}
