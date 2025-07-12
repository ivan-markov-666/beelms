import { Connection, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { TopicContent } from '../entities/topic-content.entity';
import { Injectable } from '@nestjs/common';

/**
 * Този subscriber отговаря за обновяване на search_vector полето
 * за PostgreSQL full-text search функционалност.
 *
 * За SQLite базата данни, ще се използва различен подход за търсене,
 * имплементиран на ниво application.
 */
@Injectable()
@EventSubscriber()
export class TopicContentSearchSubscriber implements EntitySubscriberInterface<TopicContent> {
  constructor(private readonly connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo(): typeof TopicContent {
    return TopicContent;
  }

  /**
   * Обновява search_vector полето за PostgreSQL преди запис
   */
  async beforeInsert(event: InsertEvent<TopicContent>): Promise<void> {
    if (this.isPostgres()) {
      await this.updateSearchVector(event.entity);
    }
  }

  /**
   * Обновява search_vector полето за PostgreSQL преди update
   */
  async beforeUpdate(event: UpdateEvent<TopicContent>): Promise<void> {
    // Проверяваме дали има промяна в title или content
    if (this.isPostgres() && event.entity && (event.entity.title !== undefined || event.entity.content !== undefined)) {
      await this.updateSearchVector(event.entity as TopicContent);
    }
  }

  /**
   * Проверява дали базата данни е PostgreSQL
   */
  private isPostgres(): boolean {
    return this.connection.options.type === 'postgres';
  }

  /**
   * Обновява search_vector полето с PostgreSQL функции за full-text search
   */
  private async updateSearchVector(entity: TopicContent): Promise<void> {
    if (!entity.title && !entity.content) {
      return;
    }

    try {
      // Генерираме tsvector с различно тегло за title (A) и content (B)
      const title = entity.title || '';
      const content = entity.content || '';

      // За PostgreSQL, изпълняваме директен SQL
      if (this.isPostgres()) {
        const queryRunner = this.connection.createQueryRunner();
        try {
          await queryRunner.connect();

          // Генерираме tsvector с различно тегло
          const result = await queryRunner.query(
            `
            SELECT 
              setweight(to_tsvector('english', $1), 'A') || 
              setweight(to_tsvector('english', $2), 'B') as search_vector
          `,
            [title, content]
          );

          if (result && result.length > 0) {
            entity.searchVector = result[0].search_vector;
          }
        } finally {
          await queryRunner.release();
        }
      } else {
        // За SQLite, съхраняваме като plain text
        // В приложението ще имплементираме отделна логика за търсене
        entity.searchVector = `${title} ${content}`;
      }
    } catch (error) {
      console.error('Error updating search vector:', error);
    }
  }
}
