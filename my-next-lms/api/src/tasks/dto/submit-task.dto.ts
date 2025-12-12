import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitTaskDto {
  @IsString()
  solution!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
