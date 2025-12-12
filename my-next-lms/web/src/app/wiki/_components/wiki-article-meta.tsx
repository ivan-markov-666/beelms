type WikiArticleMetaProps = {
  language: string;
  updatedAt: string;
};

export function WikiArticleMeta({ language, updatedAt }: WikiArticleMetaProps) {
  const updatedDate = new Date(updatedAt);

  const formattedDate = Number.isNaN(updatedDate.getTime())
    ? updatedAt
    : updatedDate.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span className="flex items-center">
        <svg
          className="mr-1 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span className="uppercase">{language}</span>
      </span>
      <span>Обновена: {formattedDate}</span>
    </div>
  );
}
