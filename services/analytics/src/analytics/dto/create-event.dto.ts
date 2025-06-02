import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    description: 'Type of the analytics event',
    example: 'test_started',
  })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({
    description: 'Event data in JSON format',
    example: {
      userId: 1,
      testId: 5,
      timestamp: '2023-06-01T12:34:56Z',
    },
  })
  @IsObject()
  @IsNotEmpty()
  eventData: Record<string, any>;
}
