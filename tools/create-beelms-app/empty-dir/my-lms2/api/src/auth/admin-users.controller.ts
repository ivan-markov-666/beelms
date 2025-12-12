import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin-users.service';
import { AdminUserSummaryDto } from './dto/admin-user-summary.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUsersStatsDto } from './dto/admin-users-stats.dto';

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
    @Query('role') role?: 'user' | 'admin',
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
  async updateActive(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<AdminUserSummaryDto> {
    return this.adminUsersService.updateUserActive(id, dto.active);
  }
}
