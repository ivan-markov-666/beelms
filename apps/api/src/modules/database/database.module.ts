import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmConfigService } from './database.config';
import * as entities from './entities';
import { TopicContentSearchSubscriber } from './subscribers/topic-content-search.subscriber';

// Изрично изброяваме ентити класовете, вместо да се опитваме да ги филтрираме динамично
const entitiesArray = [
  entities.User,
  entities.Category,
  entities.Topic,
  entities.TopicContent,
  entities.Test,
  entities.Question,
  entities.Answer,
  entities.UserProgress,
  entities.TestAttempt,
];

@Global() // Правим модула глобално достъпен според singleton pattern
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature(entitiesArray),
  ],
  providers: [
    TopicContentSearchSubscriber, // Регистрираме subscriber за full-text search
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
