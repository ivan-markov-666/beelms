export class AdminWikiArticleVersionDto {
  id: string;
  version: number;
  language: string;
  title: string;
  subtitle?: string;
  content: string;
  createdAt: string;
  createdBy: string | null;
  status: string;
}
