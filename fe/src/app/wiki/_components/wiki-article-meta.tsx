import { WikiArticleLanguages } from "./wiki-article-languages";

type WikiArticleMetaProps = {
  languages?: string[];
  updatedAt: string;
};

export function WikiArticleMeta({
  languages,
  updatedAt,
}: WikiArticleMetaProps) {
  const updatedDate = new Date(updatedAt);

  const formattedDate = Number.isNaN(updatedDate.getTime())
    ? updatedAt
    : updatedDate.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  return (
    <div className="space-y-1 text-xs text-gray-500">
      <WikiArticleLanguages languages={languages} />
      <span className="block">Обновена: {formattedDate}</span>
    </div>
  );
}
