import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationService } from './services/notification.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class SharedModule {}
