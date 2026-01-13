import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin-users.service';
import { AdminUserSummaryDto } from './dto/admin-user-summary.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUsersStatsDto } from './dto/admin-users-stats.dto';
import { AdminBulkDeleteUsersDto } from './dto/admin-bulk-delete-users.dto';
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

  @Get('count')
  async getCount(@Req() req: AuthenticatedRequest): Promise<{ total: number }> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const total = await this.adminUsersService.getTotalUsersCount(actorUserId);
    return { total };
  }

  @Get()
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: 'active' | 'deactivated',
    @Query('role') role?: UserRole,
  ): Promise<AdminUserSummaryDto[]> {
    const pageNum = page ? Number(page) : undefined;
    const pageSizeNum = pageSize ? Number(pageSize) : undefined;

    const result = await this.adminUsersService.getAdminUsersListPaged(
      pageNum,
      pageSizeNum,
      q,
      status,
      role,
    );

    res.setHeader('X-Total-Count', String(result.total));
    return result.items;
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @Res() res: Response,
    @Query('q') q?: string,
    @Query('status') status?: 'active' | 'deactivated',
    @Query('role') role?: UserRole,
  ): Promise<void> {
    const { csv, filename } = await this.adminUsersService.exportAdminUsersCsv({
      q,
      status,
      role,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }

  @Get('stats')
  async getStats(): Promise<AdminUsersStatsDto> {
    return this.adminUsersService.getAdminUsersStats();
  }

  @Delete('bulk')
  @HttpCode(200)
  async bulkDelete(
    @Body() dto: AdminBulkDeleteUsersDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    deleted: number;
  }> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }
    // NOTE: Admin must not be able to delete self.
    const deleted = await this.adminUsersService.bulkDeleteUsers(
      dto.ids,
      actorUserId,
    );
    return { deleted };
  }

  @Delete('purge-all')
  @HttpCode(200)
  async purgeAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ deleted: number }> {
    const actorUserId = req.user?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }
    // NOTE: Admin must not be able to delete self.
    const deleted = await this.adminUsersService.purgeAllUsers(actorUserId);
    return { deleted };
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
