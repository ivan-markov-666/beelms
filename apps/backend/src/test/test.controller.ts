import { Body, Controller, Post } from '@nestjs/common'
import { TestDto } from './test.dto'

@Controller('test-dto')
export class TestController {
  @Post()
  echo(@Body() dto: TestDto): TestDto {
    // Echoes back the validated DTO to demonstrate ValidationPipe works.
    return dto
  }
}
