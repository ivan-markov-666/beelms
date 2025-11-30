import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { EchoRequestDto } from './dto/echo-request.dto';

@ApiTags('training')
@Controller()
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('ping')
  @ApiOperation({
    summary: 'Ping Training API',
    description: 'Returns pong and an optional timestamp for health checks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful ping response.',
  })
  ping() {
    return this.trainingService.ping();
  }

  @Post('echo')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Echo value',
    description:
      'Echoes back the provided value together with receivedAt and requestId.',
  })
  @ApiBody({
    description: 'Echo request payload.',
    schema: {
      example: {
        value: 'test',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Echo response containing the original value and additional metadata.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error when value is missing or invalid.',
  })
  echo(@Body() body: EchoRequestDto) {
    return this.trainingService.echo(body.value);
  }
}
