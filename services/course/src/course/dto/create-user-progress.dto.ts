import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateUserProgressDto {
  @ApiProperty({
    description: 'ID на потребителя',
    example: 1,
  })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    description: 'ID на главата',
    example: 1,
  })
  @IsInt()
  @Min(1)
  chapterId: number;

  @ApiProperty({
    description: 'ID на съдържанието',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  contentId?: number;

  @ApiProperty({
    description: 'Дали съдържанието е завършено',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiProperty({
    description: 'Процент на прогреса',
    example: 50,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  progressPercentage?: number;
}
