import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsObject, IsString } from 'class-validator';

export class CreateUserProgressStatsDto {
  @ApiProperty({
    description: 'Идентификатор на потребителския прогрес',
    example: 1,
  })
  @IsNumber()
  userProgressId: number;

  @ApiProperty({ description: 'Идентификатор на съдържанието', example: 1 })
  @IsOptional()
  @IsNumber()
  contentId?: number;

  @ApiProperty({ description: 'Идентификатор на главата', example: 1 })
  @IsOptional()
  @IsNumber()
  chapterId?: number;

  @ApiProperty({ description: 'Време, прекарано в секунди', example: 120 })
  @IsNumber()
  timeSpentSeconds: number;

  @ApiProperty({ description: 'Брой посещения', example: 1 })
  @IsNumber()
  @IsOptional()
  visitCount?: number;

  @ApiProperty({
    description: 'Информация за взаимодействия',
    type: 'object',
    example: { clicks: 5, scrolls: 10 },
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  interactions?: Record<string, any>;

  @ApiProperty({
    description: 'Начало на сесията',
    example: '2023-01-01T12:00:00Z',
  })
  @IsOptional()
  sessionStartTime?: Date;

  @ApiProperty({
    description: 'Край на сесията',
    example: '2023-01-01T12:10:00Z',
  })
  @IsOptional()
  sessionEndTime?: Date;

  @ApiProperty({
    description: 'Информация за устройството',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
