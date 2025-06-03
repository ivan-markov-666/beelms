import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentApproval } from '../../entities/content-approval.entity';
import { Content } from '../../entities/content.entity';
import { ContentApprovalService } from '../../services/content-approval.service';
import { ContentApprovalController } from '../../controllers/content-approval.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentApproval])],
  controllers: [ContentApprovalController],
  providers: [ContentApprovalService],
  exports: [ContentApprovalService],
})
export class ContentApprovalModule {}
