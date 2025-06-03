import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import {
  ContentApproval,
  ApprovalStatus,
} from '../entities/content-approval.entity';
import { Content } from '../entities/content.entity';

@Injectable()
export class ScheduledPublishTask {
  private readonly logger = new Logger(ScheduledPublishTask.name);

  constructor(
    @InjectRepository(ContentApproval)
    private readonly contentApprovalRepository: Repository<ContentApproval>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  @Cron('* * * * *') // Run every minute
  async handleScheduledPublish(): Promise<void> {
    try {
      const now = new Date();
      this.logger.log(
        'Checking for content scheduled for publishing...',
        'ScheduledPublishTask',
      );

      // Find all approved content with scheduledPublishAt in the past
      const contentToPublish = await this.contentApprovalRepository.find({
        where: {
          status: ApprovalStatus.APPROVED,
          scheduledPublishAt: LessThanOrEqual(now),
          publishedAt: IsNull(),
        },
        relations: ['content'],
      });

      if (contentToPublish.length === 0) {
        this.logger.log(
          'No content to publish at this time',
          'ScheduledPublishTask',
        );
        return;
      }

      this.logger.log(
        `Found ${contentToPublish.length} content items to publish`,
        'ScheduledPublishTask',
      );

      // Process each content item in parallel
      await Promise.all(
        contentToPublish.map(async (approval) => {
          try {
            if (!approval.content) {
              this.logger.warn(
                `Skipping approval ${approval.id} - content not found`,
                'ScheduledPublishTask',
              );
              return;
            }

            await this.publishContent(approval);
            this.logger.log(
              `Successfully published content ${approval.content.id}`,
              'ScheduledPublishTask',
            );
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Error publishing content ${approval.content?.id || 'unknown'}: ${errorMessage}`,
              error instanceof Error ? error.stack : undefined,
              'ScheduledPublishTask',
              'handleScheduledPublish',
            );
          }
        }),
      );
    } catch (error: unknown) {
      this.logger.error(
        'Error in scheduled publish task',
        error instanceof Error ? error.stack : undefined,
        'ScheduledPublishTask',
        'handleScheduledPublish',
      );
    }
  }

  private async publishContent(approval: ContentApproval): Promise<void> {
    const { content } = approval;
    const now = new Date();

    // Start a transaction to ensure data consistency
    await this.contentApprovalRepository.manager
      .transaction(async (transactionalEntityManager) => {
        // Update the content status
        await transactionalEntityManager.update(Content, content.id, {
          isPublished: true,
          publishedAt: now,
          updatedAt: now,
        });

        // Update the approval record
        await transactionalEntityManager.update(ContentApproval, approval.id, {
          publishedAt: now,
          status: ApprovalStatus.PUBLISHED,
          updatedAt: now,
          scheduledPublishAt: null, // Clear the scheduled time
        });
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error in transaction: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
          'ScheduledPublishTask',
          'publishContent',
        );
        throw error; // Re-throw to be caught by the outer try-catch
      });
  }
}
