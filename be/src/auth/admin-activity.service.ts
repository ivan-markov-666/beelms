import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { WikiArticleVersion } from '../wiki/wiki-article-version.entity';
import { AdminActivityItemDto } from './dto/admin-activity-item.dto';

const MAX_ITEMS_PER_SOURCE = 200;

@Injectable()
export class AdminActivityService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(WikiArticleVersion)
    private readonly wikiVersionRepo: Repository<WikiArticleVersion>,
  ) {}

  async getRecentActivity(): Promise<AdminActivityItemDto[]> {
    const [users, versions] = await Promise.all([
      this.usersRepo.find({
        order: { createdAt: 'DESC' },
        take: MAX_ITEMS_PER_SOURCE,
      }),
      this.wikiVersionRepo.find({
        relations: ['article'],
        order: { createdAt: 'DESC' },
        take: MAX_ITEMS_PER_SOURCE,
      }),
    ]);

    const wikiCreatedByIds = Array.from(
      new Set(
        versions
          .map((v) => v.createdByUserId)
          .filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
      ),
    );

    let wikiUserEmailMap = new Map<string, string>();

    if (wikiCreatedByIds.length > 0) {
      const wikiUsers = await this.usersRepo.find({
        where: { id: In(wikiCreatedByIds) },
      });

      wikiUserEmailMap = new Map(wikiUsers.map((u) => [u.id, u.email]));
    }

    const items: AdminActivityItemDto[] = [];

    for (const version of versions) {
      const occurredAt = (version.createdAt ?? new Date()).toISOString();
      const article = version.article;

      const action:
        | 'article_created'
        | 'article_updated'
        | 'user_registered'
        | 'user_deactivated' =
        (version.versionNumber ?? 0) <= 1
          ? 'article_created'
          : 'article_updated';

      const entityId = article?.slug ?? version.id;
      const entityLabel = version.title ?? article?.slug ?? version.id;

      const createdById = version.createdByUserId;
      const actorLabel =
        createdById != null
          ? (wikiUserEmailMap.get(createdById) ?? createdById)
          : null;

      items.push({
        occurredAt,
        type: 'wiki',
        action,
        entityId,
        entityLabel,
        actorLabel,
      });
    }

    for (const user of users) {
      if (user.createdAt) {
        items.push({
          occurredAt: user.createdAt.toISOString(),
          type: 'user',
          action: 'user_registered',
          entityId: user.id,
          entityLabel: user.email,
          actorLabel: null,
        });
      }

      if (!user.active) {
        const occurredAt = (
          user.updatedAt ??
          user.createdAt ??
          new Date()
        ).toISOString();

        items.push({
          occurredAt,
          type: 'user',
          action: 'user_deactivated',
          entityId: user.id,
          entityLabel: user.email,
          actorLabel: null,
        });
      }
    }

    items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    // Hard cap to avoid returning an excessively large payload
    const MAX_TOTAL_ITEMS = MAX_ITEMS_PER_SOURCE * 2;
    return items.slice(0, MAX_TOTAL_ITEMS);
  }
}
