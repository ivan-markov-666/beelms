export class WikiArticleDetailDto {
  id: string;
  slug: string;
  visibility?: string;
  tags?: string[];
  language: string;
  title: string;
  subtitle?: string;
  content: string;
  status: string;
  articleStatus?: string;
  languageStatus?: string;
  statusAllLanguagesPublishSummary?: {
    published: string[];
    skippedMissingFields: string[];
    skippedMissingTranslation: string[];
  };
  updatedAt: string;
}
