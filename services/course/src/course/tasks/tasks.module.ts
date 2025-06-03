import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentApproval } from '../entities/content-approval.entity';
import { Content } from '../entities/content.entity';
import { ScheduledPublishTask } from './scheduled-publish.task';
import { ContentApprovalModule } from '../modules/content-approval/content-approval.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, ContentApproval]),
    ContentApprovalModule,
  ],
  providers: [ScheduledPublishTask],
})
export class TasksModule {}
