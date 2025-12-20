import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class AdminGrantCourseAccessDto {
  @IsUUID('4')
  userId: string;

  @IsOptional()
  @IsBoolean()
  enroll?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  grantReason?: string;
}
