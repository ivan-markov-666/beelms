export class AdminWikiArticleVersionDto {
  id: string;
  version: number;
  language: string;
  title: string;
  createdAt: string;
  createdBy: string | null;
}
