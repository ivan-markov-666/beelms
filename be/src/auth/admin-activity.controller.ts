import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminActivityService } from './admin-activity.service';
import { AdminActivityItemDto } from './dto/admin-activity-item.dto';

@Controller('admin/activity')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminActivityController {
  constructor(private readonly activityService: AdminActivityService) {}

  @Get()
  async getRecent(): Promise<AdminActivityItemDto[]> {
    return this.activityService.getRecentActivity();
  }
}
