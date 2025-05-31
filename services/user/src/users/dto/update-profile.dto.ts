import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'The avatar URL of the user',
    required: false,
  })
  @IsUrl({}, { message: 'Please provide a valid URL for the avatar' })
  @IsOptional()
  avatar_url?: string;

  @ApiProperty({
    example: { theme: 'dark', notifications: true },
    description: 'User preferences',
    required: false,
  })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
