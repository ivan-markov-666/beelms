import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

export enum NotificationType {
  CONTENT_SUBMITTED = 'content.submitted',
  CONTENT_APPROVED = 'content.approved',
  CONTENT_REJECTED = 'content.rejected',
  CONTENT_PUBLISHED = 'content.published',
  CONTENT_SCHEDULED = 'content.scheduled',
}

export interface NotificationPayload {
  contentId: number;
  contentTitle: string;
  userId: number;
  reviewerId?: number;
  comments?: string;
  scheduledPublishAt?: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Emit a notification event
   */
  notify(type: NotificationType, payload: NotificationPayload) {
    this.eventEmitter.emit(type, payload);
    this.logger.log(
      `Notification sent: ${type} for content ${payload.contentId}`,
    );
  }

  /**
   * Handle content submitted for review
   */
  @OnEvent(NotificationType.CONTENT_SUBMITTED)
  handleContentSubmitted(payload: NotificationPayload) {
    // In a real app, this would send an email, in-app notification, etc.
    this.logger.log(
      `Content ${payload.contentId} submitted for review by user ${payload.userId}`,
    );

    // Example: Send email to reviewers
    // await this.emailService.sendToReviewers({
    //   contentId: payload.contentId,
    //   title: payload.contentTitle,
    //   submitterId: payload.userId,
    // });
  }

  /**
   * Handle content approval
   */
  @OnEvent(NotificationType.CONTENT_APPROVED)
  handleContentApproved(payload: NotificationPayload) {
    this.logger.log(
      `Content ${payload.contentId} approved by reviewer ${payload.reviewerId}`,
    );

    // Notify content author
    // await this.notificationClient.send({
    //   userId: payload.userId,
    //   type: 'content_approved',
    //   data: {
    //     contentId: payload.contentId,
    //     contentTitle: payload.contentTitle,
    //     reviewerId: payload.reviewerId,
    //   },
    // });
  }

  /**
   * Handle content rejection
   */
  @OnEvent(NotificationType.CONTENT_REJECTED)
  handleContentRejected(payload: NotificationPayload) {
    this.logger.log(
      `Content ${payload.contentId} rejected by reviewer ${payload.reviewerId}`,
    );

    // Notify content author with comments
    // await this.emailService.send({
    //   to: await this.userService.getEmail(payload.userId),
    //   subject: `Your content needs changes: ${payload.contentTitle}`,
    //   template: 'content-rejected',
    //   context: {
    //     contentTitle: payload.contentTitle,
    //     comments: payload.comments,
    //     contentLink: `/content/${payload.contentId}/edit`,
    //   },
    // });
  }

  /**
   * Handle content published
   */
  @OnEvent(NotificationType.CONTENT_PUBLISHED)
  handleContentPublished(payload: NotificationPayload) {
    this.logger.log(`Content ${payload.contentId} has been published`);

    // Notify all subscribers or relevant users
    // const subscribers = await this.contentService.getContentSubscribers(payload.contentId);
    // await this.notificationClient.broadcast({
    //   userIds: subscribers,
    //   type: 'content_published',
    //   data: {
    //     contentId: payload.contentId,
    //     contentTitle: payload.contentTitle,
    //   },
    // });
  }

  /**
   * Handle content scheduled for publishing
   */
  @OnEvent(NotificationType.CONTENT_SCHEDULED)
  handleContentScheduled(payload: NotificationPayload) {
    this.logger.log(
      `Content ${payload.contentId} scheduled for publishing at ${payload.scheduledPublishAt ? payload.scheduledPublishAt.toISOString() : 'unknown date'}`,
    );

    // Notify content author
    // await this.notificationClient.send({
    //   userId: payload.userId,
    //   type: 'content_scheduled',
    //   data: {
    //     contentId: payload.contentId,
    //     contentTitle: payload.contentTitle,
    //     scheduledPublishAt: payload.scheduledPublishAt,
    //   },
    // });
  }
}
