type WikiArticleMetaProps = {
  language: string;
  updatedAt: string;
};

export function WikiArticleMeta({ language, updatedAt }: WikiArticleMetaProps) {
  const updatedDate = new Date(updatedAt);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
      <span className="uppercase tracking-wide text-xs font-semibold">
        {language}
      </span>
      <span>Последна редакция: {updatedDate.toLocaleDateString("bg-BG")}</span>
    </div>
  );
}
