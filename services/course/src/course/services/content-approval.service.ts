import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../entities/content.entity';
import {
  ContentApproval,
  ApprovalStatus,
} from '../entities/content-approval.entity';
import {
  SubmitForReviewDto,
  ReviewContentDto,
  SchedulePublishDto,
  ContentApprovalFilterDto,
} from '../dto/content-approval.dto';
import {
  NotificationService,
  NotificationType,
} from '../../shared/services/notification.service';

@Injectable()
export class ContentApprovalService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentApproval)
    private readonly contentApprovalRepository: Repository<ContentApproval>,
    private readonly notificationService: NotificationService,
  ) {}

  async submitForReview(
    contentId: number,
    dto: SubmitForReviewDto,
    userId: number,
  ): Promise<ContentApproval> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['approval'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    let approval = content.approval;
    if (!approval) {
      approval = new ContentApproval();
      approval.content = content;
      approval.reviewComments = dto.changeDescription || '';
    } else if (approval.status === ApprovalStatus.PENDING_REVIEW) {
      throw new BadRequestException('Content is already under review');
    } else {
      approval.reviewComments =
        dto.changeDescription || approval.reviewComments || '';
    }

    approval.status = ApprovalStatus.PENDING_REVIEW;
    approval.reviewedBy = null;
    approval.reviewedAt = null;
    approval.scheduledPublishAt = null;

    const savedApproval = await this.contentApprovalRepository.save(approval);

    // Send notification to reviewers
    if (content.title && content.createdBy) {
      this.notificationService.notify(NotificationType.CONTENT_SUBMITTED, {
        contentId: contentId,
        contentTitle: content.title,
        userId: content.createdBy, // Content creator
        reviewerId: userId, // User who submitted for review
        comments: dto.changeDescription || '',
      });
    }

    return savedApproval;
  }

  async reviewContent(
    contentId: number,
    dto: ReviewContentDto,
  ): Promise<ContentApproval> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['approval'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (!content.approval) {
      throw new BadRequestException(
        'Content has not been submitted for review',
      );
    }

    const { status, reviewComments, reviewedBy } = dto;
    content.approval.status = status;
    content.approval.reviewComments = reviewComments || '';
    content.approval.reviewedBy = reviewedBy;
    content.approval.reviewedAt = new Date();

    // If rejected, reset to draft status
    if (status === ApprovalStatus.REJECTED) {
      content.approval.status = ApprovalStatus.DRAFT;
    }

    const savedApproval = await this.contentApprovalRepository.save(
      content.approval,
    );

    // Send notification to content creator
    if (content.title && content.createdBy) {
      const notificationType =
        status === ApprovalStatus.REJECTED
          ? NotificationType.CONTENT_REJECTED
          : NotificationType.CONTENT_APPROVED;

      this.notificationService.notify(notificationType, {
        contentId: contentId,
        contentTitle: content.title,
        userId: content.createdBy,
        reviewerId: dto.reviewedBy,
        comments: reviewComments || '',
      });
    }

    return savedApproval;
  }

  async schedulePublish(
    contentId: number,
    dto: SchedulePublishDto,
  ): Promise<ContentApproval | null> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['approval'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.approval?.status !== ApprovalStatus.APPROVED) {
      throw new BadRequestException(
        'Content must be approved before scheduling',
      );
    }

    const scheduledDate = new Date(dto.scheduledPublishAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Invalid scheduled date');
    }

    if (scheduledDate <= new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    const approval = content.approval;
    approval.scheduledPublishAt = scheduledDate;
    approval.status = ApprovalStatus.APPROVED; // Ensure status is still approved

    const savedApproval = await this.contentApprovalRepository.save(approval);

    // Send scheduled notification
    this.notificationService.notify(NotificationType.CONTENT_SCHEDULED, {
      contentId: contentId,
      contentTitle: content.title,
      userId: content.createdBy,
      scheduledPublishAt: scheduledDate,
      comments: `Content scheduled for publishing on ${scheduledDate.toLocaleString()}`,
    });

    return savedApproval;
  }

  async getContentApprovals(
    filter: ContentApprovalFilterDto,
  ): Promise<[ContentApproval[], number]> {
    const query = this.contentApprovalRepository
      .createQueryBuilder('approval')
      .leftJoinAndSelect('approval.content', 'content')
      .leftJoinAndSelect('content.chapter', 'chapter')
      .leftJoinAndSelect('chapter.course', 'course');

    if (filter.status) {
      query.andWhere('approval.status = :status', {
        status: filter.status,
      });
    }

    if (filter.createdBy) {
      query.andWhere('content.createdBy = :createdBy', {
        createdBy: filter.createdBy,
      });
    }

    if (filter.reviewedBy) {
      query.andWhere('approval.reviewedBy = :reviewedBy', {
        reviewedBy: filter.reviewedBy,
      });
    }

    if (filter.searchTerm) {
      query.andWhere(
        '(content.title ILIKE :searchTerm OR content.content ILIKE :searchTerm)',
        { searchTerm: `%${filter.searchTerm}%` },
      );
    }

    // Add pagination
    const { page = 1, limit = 10 } = filter;
    query.skip((page - 1) * limit).take(limit);

    return query.orderBy('approval.updatedAt', 'DESC').getManyAndCount();
  }

  async getContentApproval(contentId: number): Promise<ContentApproval | null> {
    return this.contentApprovalRepository.findOne({
      where: { contentId },
      relations: ['content', 'content.chapter', 'content.chapter.course'],
    });
  }

  async cancelScheduledPublish(
    contentId: number,
  ): Promise<ContentApproval | null> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['approval'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (!content.approval) {
      throw new BadRequestException(
        'No approval record found for this content',
      );
    }

    content.approval.scheduledPublishAt = null;
    const updatedApproval = await this.contentApprovalRepository.save(
      content.approval,
    );

    // Notify about the cancellation
    if (content.title && content.createdBy) {
      this.notificationService.notify(NotificationType.CONTENT_SCHEDULED, {
        contentId: contentId,
        contentTitle: content.title,
        userId: content.createdBy,
        scheduledPublishAt: undefined,
        comments: 'Scheduled publishing has been canceled',
      });
    }

    return updatedApproval;
  }
}
