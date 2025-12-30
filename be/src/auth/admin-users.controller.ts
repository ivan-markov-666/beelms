import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin-users.service';
import { AdminUserSummaryDto } from './dto/admin-user-summary.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUsersStatsDto } from './dto/admin-users-stats.dto';
import type { UserRole } from './user-role';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
  };
};

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: 'active' | 'deactivated',
    @Query('role') role?: UserRole,
  ): Promise<AdminUserSummaryDto[]> {
    const pageNum = page ? Number(page) : undefined;
    const pageSizeNum = pageSize ? Number(pageSize) : undefined;

    return this.adminUsersService.getAdminUsersList(
      pageNum,
      pageSizeNum,
      q,
      status,
      role,
    );
  }

  @Get('stats')
  async getStats(): Promise<AdminUsersStatsDto> {
    return this.adminUsersService.getAdminUsersStats();
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminUserSummaryDto> {
    return this.adminUsersService.updateUser(id, dto, req.user?.userId);
  }
}
