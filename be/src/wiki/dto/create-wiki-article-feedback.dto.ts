import { IsBoolean } from 'class-validator';

export class CreateWikiArticleFeedbackDto {
  @IsBoolean()
  helpful: boolean;
}
