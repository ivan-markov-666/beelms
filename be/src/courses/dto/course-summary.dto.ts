export class CourseSummaryDto {
  id: string;
  title: string;
  description: string;
  language: string;
  languages: string[];
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
  categoryId: string | null;
  category: {
    slug: string;
    title: string;
  } | null;
}
