type WikiArticleMetaProps = {
  language: string;
  updatedAt: string;
};

export function WikiArticleMeta({ language, updatedAt }: WikiArticleMetaProps) {
  const updatedDate = new Date(updatedAt);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        {language}
      </span>
      <span className="text-xs sm:text-sm">
        Последна редакция: {updatedDate.toLocaleDateString("bg-BG")}
      </span>
    </div>
  );
}
