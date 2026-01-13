import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
} from 'class-validator';

export class AdminBulkUpdateCourseStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];

  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;
}
