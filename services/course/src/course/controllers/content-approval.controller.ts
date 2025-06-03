import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { ContentApprovalService } from '../services/content-approval.service';
import {
  SubmitForReviewDto,
  ReviewContentDto,
  SchedulePublishDto,
  ContentApprovalFilterDto,
} from '../dto/content-approval.dto';

@ApiTags('Content Approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('content-approval')
export class ContentApprovalController {
  constructor(
    private readonly contentApprovalService: ContentApprovalService,
  ) {}

  @Post(':contentId/submit')
  @Roles('author', 'admin')
  @ApiOperation({ summary: 'Submit content for review' })
  @ApiResponse({ status: 201, description: 'Content submitted for review' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 400, description: 'Content already under review' })
  async submitForReview(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Body() dto: SubmitForReviewDto,
    @User() user: { userId: number },
  ) {
    return this.contentApprovalService.submitForReview(
      contentId,
      dto,
      user.userId,
    );
  }

  @Post(':contentId/review')
  @Roles('reviewer', 'admin')
  @ApiOperation({ summary: 'Review content' })
  @ApiResponse({ status: 200, description: 'Content reviewed successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 400, description: 'Content not submitted for review' })
  async reviewContent(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Body() dto: ReviewContentDto,
    @User() user: { userId: number },
  ) {
    // Set the reviewer ID from the authenticated user
    dto.reviewedBy = user.userId;
    return this.contentApprovalService.reviewContent(contentId, dto);
  }

  @Post(':contentId/schedule')
  @Roles('editor', 'admin')
  @ApiOperation({ summary: 'Schedule content for publishing' })
  @ApiResponse({ status: 200, description: 'Content scheduled for publishing' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({
    status: 400,
    description: 'Content must be approved before scheduling',
  })
  async schedulePublish(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Body() dto: SchedulePublishDto,
  ) {
    return this.contentApprovalService.schedulePublish(contentId, dto);
  }

  @Get()
  @Roles('reviewer', 'editor', 'admin')
  @ApiOperation({ summary: 'Get content approvals with filters' })
  @ApiResponse({ status: 200, description: 'List of content approvals' })
  async getContentApprovals(@Query() filter: ContentApprovalFilterDto) {
    return this.contentApprovalService.getContentApprovals(filter);
  }

  @Get(':contentId')
  @Roles('reviewer', 'editor', 'admin')
  @ApiOperation({ summary: 'Get content approval details' })
  @ApiResponse({ status: 200, description: 'Content approval details' })
  @ApiResponse({ status: 404, description: 'Content approval not found' })
  async getContentApproval(
    @Param('contentId', ParseIntPipe) contentId: number,
  ) {
    const approval =
      await this.contentApprovalService.getContentApproval(contentId);
    if (!approval) {
      throw new NotFoundException('Content approval not found');
    }
    return approval;
  }

  @Delete(':contentId/schedule')
  @Roles('editor', 'admin')
  @ApiOperation({ summary: 'Cancel scheduled publishing' })
  @ApiResponse({ status: 200, description: 'Scheduled publishing cancelled' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({
    status: 400,
    description: 'No scheduled publish found for this content',
  })
  async cancelScheduledPublish(
    @Param('contentId', ParseIntPipe) contentId: number,
  ) {
    return this.contentApprovalService.cancelScheduledPublish(contentId);
  }
}
