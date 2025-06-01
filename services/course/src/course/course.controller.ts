import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CourseService } from './course.service';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { Content } from './entities/content.entity';
import { UserProgress } from './entities/user-progress.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Курсове')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ============== Курсове ==============

  @Get()
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Списък с курсове',
    type: [Course],
  })
  @ApiOperation({
    summary: 'Вземи всички курсове',
    description:
      'Връща списък с всички курсове, с възможност за филтриране по активни',
  })
  getCourses(
    @Query('isActive') isActive?: boolean | string,
  ): Promise<Course[]> {
    let isActiveBoolean: boolean | undefined;
    
    if (isActive !== undefined) {
      isActiveBoolean = isActive === 'true' || isActive === true;
    }

    return this.courseService.getCourses(isActiveBoolean);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получаване на курс по ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Данни за курса',
    type: Course,
  })
  @ApiResponse({
    status: 404,
    description: 'Курсът не е намерен',
  })
  async getCourseById(@Param('id', ParseIntPipe) id: number): Promise<Course> {
    return this.courseService.getCourseById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Създаване на нов курс',
  })
  @ApiResponse({
    status: 201,
    description: 'Курсът е създаден успешно',
    type: Course,
  })
  @ApiResponse({
    status: 400,
    description: 'Невалидни данни',
  })
  @ApiResponse({
    status: 401,
    description: 'Неоторизиран достъп',
  })
  @ApiResponse({
    status: 403,
    description: 'Забранен достъп',
  })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    return this.courseService.createCourse(createCourseDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновяване на съществуващ курс' })
  @ApiResponse({ status: 200, description: 'Курсът е обновен успешно', type: Course })
  @ApiResponse({ status: 400, description: 'Невалидни данни' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Курсът не е намерен' })
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    return this.courseService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Изтриване на курс' })
  @ApiResponse({ status: 204, description: 'Курсът е изтрит успешно' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Курсът не е намерен' })
  async deleteCourse(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.courseService.deleteCourse(id);
  }

  // ============== Глави ==============

  @Get(':courseId/chapters')
  @ApiOperation({ summary: 'Получаване на всички глави за даден курс' })
  @ApiResponse({ status: 200, description: 'Списък с всички глави за курса', type: [Chapter] })
  @ApiResponse({ status: 404, description: 'Курсът не е намерен' })
  async getChapters(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<Chapter[]> {
    return this.courseService.getChapters(courseId);
  }

  @Get('chapters/:id')
  @ApiOperation({ summary: 'Получаване на глава по ID' })
  @ApiResponse({ status: 200, description: 'Данни за главата', type: Chapter })
  @ApiResponse({ status: 404, description: 'Главата не е намерена' })
  async getChapterById(@Param('id', ParseIntPipe) id: number): Promise<Chapter> {
    return this.courseService.getChapterById(id);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Създаване на нова глава' })
  @ApiResponse({ status: 201, description: 'Главата е създадена успешно', type: Chapter })
  @ApiResponse({ status: 400, description: 'Невалидни данни' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Курсът не е намерен' })
  async createChapter(@Body() createChapterDto: CreateChapterDto): Promise<Chapter> {
    return this.courseService.createChapter(createChapterDto);
  }

  @Put('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновяване на съществуваща глава' })
  @ApiResponse({ status: 200, description: 'Главата е обновена успешно', type: Chapter })
  @ApiResponse({ status: 400, description: 'Невалидни данни' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Главата не е намерена' })
  async updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChapterDto: UpdateChapterDto,
  ): Promise<Chapter> {
    return this.courseService.updateChapter(id, updateChapterDto);
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Изтриване на глава' })
  @ApiResponse({ status: 204, description: 'Главата е изтрита успешно' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Главата не е намерена' })
  async deleteChapter(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.courseService.deleteChapter(id);
  }

  // ============== Съдържание ==============

  @Get('chapters/:chapterId/contents')
  @ApiOperation({ summary: 'Получаване на цялото съдържание за дадена глава' })
  @ApiResponse({ status: 200, description: 'Списък със съдържание за главата', type: [Content] })
  @ApiResponse({ status: 404, description: 'Главата не е намерена' })
  async getContentsByChapterId(
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ): Promise<Content[]> {
    return this.courseService.getContentsByChapterId(chapterId);
  }

  @Get('contents/:id')
  @ApiOperation({ summary: 'Получаване на съдържание по ID' })
  @ApiResponse({ status: 200, description: 'Данни за съдържанието', type: Content })
  @ApiResponse({ status: 404, description: 'Съдържанието не е намерено' })
  async getContentById(@Param('id', ParseIntPipe) id: number): Promise<Content> {
    return this.courseService.getContentById(id);
  }

  @Post('contents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Създаване на ново съдържание' })
  @ApiResponse({ status: 201, description: 'Съдържанието е създадено успешно', type: Content })
  @ApiResponse({ status: 400, description: 'Невалидни данни' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Главата не е намерена' })
  async createContent(@Body() createContentDto: CreateContentDto): Promise<Content> {
    return this.courseService.createContent(createContentDto);
  }

  @Put('contents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновяване на съществуващо съдържание' })
  @ApiResponse({ status: 200, description: 'Съдържанието е обновено успешно', type: Content })
  @ApiResponse({ status: 400, description: 'Невалидни данни' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Съдържанието не е намерено' })
  async updateContent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentDto: UpdateContentDto,
  ): Promise<Content> {
    return this.courseService.updateContent(id, updateContentDto);
  }

  @Delete('contents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Изтриване на съдържание' })
  @ApiResponse({ status: 204, description: 'Съдържанието е изтрито успешно' })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 403, description: 'Забранен достъп' })
  @ApiResponse({ status: 404, description: 'Съдържанието не е намерено' })
  async deleteContent(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.courseService.deleteContent(id);
  }

  // ============== Проследяване на прогреса ==============

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получаване на прогреса на потребителя' })
  @ApiResponse({ status: 200, description: 'Прогрес на потребителя', type: [UserProgress] })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiQuery({ name: 'courseId', required: false, type: Number, description: 'ID на курс за филтриране' })
  async getUserProgress(
    @Req() req,
    @Query('courseId', new ParseIntPipe({ optional: true })) courseId?: number,
  ): Promise<UserProgress[]> {
    const userId = req.user.id;
    return this.courseService.getUserProgress(userId, courseId);
  }

  @Post('progress/chapter/:chapterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновяване на прогреса за глава' })
  @ApiResponse({ status: 200, description: 'Прогресът е обновен успешно', type: UserProgress })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 404, description: 'Главата не е намерена' })
  async updateChapterProgress(
    @Req() req,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() body: { completed?: boolean; progressPercentage?: number },
  ): Promise<UserProgress> {
    const userId = req.user.id;
    const { completed = false, progressPercentage = 0 } = body;
    return this.courseService.updateUserProgress(
      userId,
      chapterId,
      undefined,
      completed,
      progressPercentage,
    );
  }

  @Post('progress/content/:contentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновяване на прогреса за съдържание' })
  @ApiResponse({ status: 200, description: 'Прогресът е обновен успешно', type: UserProgress })
  @ApiResponse({ status: 401, description: 'Неоторизиран достъп' })
  @ApiResponse({ status: 404, description: 'Съдържанието не е намерено' })
  async updateContentProgress(
    @Req() req,
    @Param('contentId', ParseIntPipe) contentId: number,
    @Body() body: { completed?: boolean; progressPercentage?: number },
  ): Promise<UserProgress> {
    const userId = req.user.id;
    const content = await this.courseService.getContentById(contentId);
    const { completed = false, progressPercentage = 0 } = body;
    return this.courseService.updateUserProgress(
      userId,
      content.chapterId,
      contentId,
      completed,
      progressPercentage,
    );
  }
}
