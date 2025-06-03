import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
  IsString,
} from 'class-validator';

export class UpdateUserProgressDto {
  @ApiProperty({
    description: 'Дали съдържанието е завършено',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiProperty({
    description: 'Процент на прогреса',
    example: 75,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  progressPercentage?: number;

  @ApiProperty({
    description: 'Време, прекарано в секунди',
    example: 120,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  timeSpentSeconds?: number;

  @ApiProperty({
    description: 'Информация за устройството на потребителя',
    example: 'Chrome 92.0 on Windows 10',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceInfo?: string;
}
