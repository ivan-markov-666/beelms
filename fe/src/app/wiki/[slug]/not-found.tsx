import { WikiMain } from "../_components/wiki-main";
import { WikiBackLink } from "../_components/wiki-back-link";

export default function WikiArticleNotFound() {
  return (
    <WikiMain>
      <header className="space-y-2">
        <WikiBackLink />
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Статията не е намерена
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Тази статия може да е била премахната или никога не е съществувала.
        </p>
      </header>
    </WikiMain>
  );
}
