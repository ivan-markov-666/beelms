import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { Test } from './entities/test.entity';
import { Question } from './entities/question.entity';
import { UserTestAttempt } from './entities/user-test-attempt.entity';
import { UserAnswer } from './entities/user-answer.entity';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Test, Question, UserTestAttempt, UserAnswer]),
    CacheModule.register(),
    AnalyticsModule,
  ],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}
