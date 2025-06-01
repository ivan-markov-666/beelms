import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TestService } from './test.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTestDto,
  UpdateTestDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  StartTestAttemptDto,
  SubmitAnswerDto,
  CompleteTestAttemptDto,
} from './dto';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestController {
  constructor(private readonly testService: TestService) {}

  // Test endpoints
  @Post()
  createTest(@Body() createTestDto: CreateTestDto) {
    return this.testService.createTest(createTestDto);
  }

  @Get()
  findAllTests() {
    return this.testService.findAllTests();
  }

  @Get('chapter/:chapterId')
  findTestsByChapterId(@Param('chapterId', ParseIntPipe) chapterId: number) {
    return this.testService.findTestsByChapterId(chapterId);
  }

  @Get(':id')
  findTestById(@Param('id', ParseIntPipe) id: number) {
    return this.testService.findTestById(id);
  }

  @Patch(':id')
  updateTest(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTestDto: UpdateTestDto,
  ) {
    return this.testService.updateTest(id, updateTestDto);
  }

  @Delete(':id')
  removeTest(@Param('id', ParseIntPipe) id: number) {
    return this.testService.removeTest(id);
  }

  // Question endpoints
  @Post('questions')
  createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.testService.createQuestion(createQuestionDto);
  }

  @Get('questions/:id')
  findQuestionById(@Param('id', ParseIntPipe) id: number) {
    return this.testService.findQuestionById(id);
  }

  @Patch('questions/:id')
  updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.testService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  removeQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.testService.removeQuestion(id);
  }

  // Test attempt endpoints
  @Post('attempts/start')
  startTestAttempt(@Body() startTestAttemptDto: StartTestAttemptDto) {
    return this.testService.startTestAttempt(startTestAttemptDto);
  }

  @Post('attempts/submit-answer')
  submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto) {
    return this.testService.submitAnswer(submitAnswerDto);
  }

  @Post('attempts/complete')
  completeTestAttempt(@Body() completeTestAttemptDto: CompleteTestAttemptDto) {
    return this.testService.completeTestAttempt(completeTestAttemptDto);
  }

  @Get('user/:userId/attempts')
  getUserTestAttempts(@Param('userId', ParseIntPipe) userId: number) {
    return this.testService.getUserTestAttempts(userId);
  }

  @Get('attempts/:attemptId')
  getTestAttemptDetails(@Param('attemptId', ParseIntPipe) attemptId: number) {
    return this.testService.getTestAttemptDetails(attemptId);
  }
}
