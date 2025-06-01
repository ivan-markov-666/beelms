import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UserSettingsDto {
  @ApiProperty({
    description: 'User preferences as JSON object',
    example: { darkMode: true, notifications: { email: true, push: false } },
    required: true,
  })
  @IsObject()
  preferences: Record<string, any>;
}

export class UpdateUserSettingsDto {
  @ApiProperty({
    description: 'User preferences as JSON object',
    example: { darkMode: true, notifications: { email: true, push: false } },
    required: false,
  })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
