import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Импорт на всички ентитети директно
import { BaseEntity } from '../entities/base.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Topic } from '../entities/topic.entity';
import { TopicContent } from '../entities/topic-content.entity';
import { Test } from '../entities/test.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { TestAttempt } from '../entities/test-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [BaseEntity, User, Category, Topic, TopicContent, Test, Question, Answer, UserProgress, TestAttempt],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([User, Category, Topic, TopicContent, Test, Question, Answer, UserProgress, TestAttempt]),
  ],
  exports: [TypeOrmModule],
})
export class DbTestModule {}
