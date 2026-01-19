import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TeacherGuard } from '../auth/teacher.guard';
import { CoursesService } from './courses.service';
import { AdminCourseSummaryDto } from './dto/admin-course-summary.dto';
import { AdminCourseDetailDto } from './dto/admin-course-detail.dto';
import { AdminCreateCourseDto } from './dto/admin-create-course.dto';
import { AdminUpdateCourseDto } from './dto/admin-update-course.dto';
import { AdminGrantCourseAccessDto } from './dto/admin-grant-course-access.dto';
import { AdminBulkDeleteCoursesDto } from './dto/admin-bulk-delete-courses.dto';
import { AdminBulkUpdateCourseStatusDto } from './dto/admin-bulk-update-course-status.dto';

function parseLanguages(raw: string | undefined): string[] {
  const parts = (raw ?? '')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0);
  return Array.from(new Set(parts));
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('count')
  async getCount(@Req() req: AuthenticatedRequest): Promise<{ total: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const total = await this.coursesService.getAdminCoursesCount(userId);
    return { total };
  }

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('languages') languages?: string,
    @Query('language') language?: string,
    @Query('paid') paid?: 'paid' | 'free',
    @Query('categoryId') categoryId?: string,
    @Query('sortKey')
    sortKey?:
      | 'createdAt'
      | 'updatedAt'
      | 'title'
      | 'category'
      | 'language'
      | 'status'
      | 'paid'
      | 'price',
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ): Promise<AdminCourseSummaryDto[]> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const pageNum = page ? Number(page) : 1;
    const pageSizeNum = pageSize ? Number(pageSize) : 20;

    const langsFromList = parseLanguages(languages);
    const languageNormalized = (language ?? '').trim().toLowerCase();
    const effectiveLanguages =
      langsFromList.length > 0
        ? langsFromList
        : languageNormalized
          ? [languageNormalized]
          : undefined;

    const result = await this.coursesService.getAdminCoursesListPaged(userId, {
      page: pageNum,
      pageSize: pageSizeNum,
      q,
      status,
      languages: effectiveLanguages,
      paid,
      categoryId,
      sortKey,
      sortDir,
    });

    res.setHeader('X-Total-Count', String(result.total));
    return result.items;
  }

  @Get('export.csv')
  async exportCsv(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('languages') languages?: string,
    @Query('language') language?: string,
    @Query('paid') paid?: 'paid' | 'free',
    @Query('categoryId') categoryId?: string,
    @Query('sortKey')
    sortKey?:
      | 'createdAt'
      | 'updatedAt'
      | 'title'
      | 'category'
      | 'language'
      | 'status'
      | 'paid'
      | 'price',
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const langsFromList = parseLanguages(languages);
    const languageNormalized = (language ?? '').trim().toLowerCase();
    const effectiveLanguages =
      langsFromList.length > 0
        ? langsFromList
        : languageNormalized
          ? [languageNormalized]
          : undefined;

    const { csv, filename } = await this.coursesService.exportAdminCoursesCsv(
      userId,
      {
        q,
        status,
        languages: effectiveLanguages,
        paid,
        categoryId,
        sortKey,
        sortDir,
      },
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }

  @Patch('status/bulk')
  @HttpCode(200)
  async bulkUpdateStatus(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AdminBulkUpdateCourseStatusDto,
  ): Promise<{ updated: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const updated = await this.coursesService.adminBulkUpdateCourseStatus(
      userId,
      dto.ids,
      dto.status,
    );
    return { updated };
  }

  @Delete('bulk')
  @HttpCode(200)
  async bulkDelete(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AdminBulkDeleteCoursesDto,
  ): Promise<{ deleted: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const deleted = await this.coursesService.adminBulkDeleteCourses(
      userId,
      dto.ids,
    );
    return { deleted };
  }

  @Delete('purge-all')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async purgeAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ deleted: number }> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const deleted = await this.coursesService.adminPurgeAllCourses(userId);
    return { deleted };
  }

  @Get(':courseId')
  async getOne(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminCourseDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getAdminCourseDetail(courseId, userId);
  }

  @Post()
  async create(
    @Body() dto: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminCourseDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.adminCreateCourse(
      dto as AdminCreateCourseDto,
      userId,
    );
  }

  @Patch(':courseId')
  update(
    @Param('courseId') courseId: string,
    @Body() dto: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminCourseDetailDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.adminUpdateCourse(
      courseId,
      dto as AdminUpdateCourseDto,
      userId,
    );
  }

  @Post(':courseId/grants')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async grantCourseAccess(
    @Param('courseId', new ParseUUIDPipe({ version: '4' })) courseId: string,
    @Body() dto: AdminGrantCourseAccessDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    await this.coursesService.adminGrantCourseAccess(
      courseId,
      dto,
      adminUserId,
    );
  }
}
