import { IsIn, IsString } from 'class-validator';

export class AdminUpdateWikiStatusDto {
  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;
}
