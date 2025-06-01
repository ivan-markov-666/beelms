import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MaxLength,
  IsOptional,
  IsInt,
  MinLength,
} from 'class-validator';

export class CreateTestDto {
  @ApiProperty({
    description: 'ID of the chapter this test belongs to',
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'Chapter ID is required' })
  @IsNumber({}, { message: 'Chapter ID must be a number' })
  @IsInt({ message: 'Chapter ID must be an integer' })
  @Min(1, { message: 'Chapter ID must be a positive number' })
  chapter_id: number;

  @ApiProperty({
    description: 'Title of the test',
    example: 'Introduction to Programming',
    maxLength: 255,
    required: true,
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Title cannot be longer than 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the test',
    example: 'This test covers basic programming concepts',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  time_limit: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  passing_score: number;
}
