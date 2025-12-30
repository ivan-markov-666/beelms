import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureEnabledGuard } from '../settings/feature-enabled.guard';
import { CoursesService } from './courses.service';
import { MyCourseListItemDto } from './dto/my-course-list-item.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('users/me/courses')
@UseGuards(FeatureEnabledGuard('courses'), JwtAuthGuard)
export class MyCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listMyCourses(
    @Req() req: AuthenticatedRequest,
  ): Promise<MyCourseListItemDto[]> {
    if (!req.user) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.coursesService.getMyCourses(req.user.userId);
  }
}
