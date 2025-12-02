import { normalizeLang, type SupportedLang } from "../../../i18n/config";
import { t } from "../../../i18n/t";

type LegalPageSearchParams = {
  lang?: string;
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams?: LegalPageSearchParams | Promise<LegalPageSearchParams>;
} = {}) {
  const resolvedSearchParams =
    ((await searchParams) ?? {}) as LegalPageSearchParams;

  const rawLang = resolvedSearchParams.lang ?? null;
  const lang: SupportedLang = normalizeLang(rawLang);
  const isBg = lang === "bg";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Legal / GDPR
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t(lang, "common", "legalPrivacyTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          {t(lang, "common", "legalPrivacyIntro")}
        </p>
      </header>

      <section className="space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
        {isBg ? (
          <>
            <p>
              QA4Free събира и обработва минимален набор от лични данни, описани в
              PRD/MVP документацията – основно имейл адрес и техническа информация
              за сесиите, необходима за вход, защита от злоупотреби и подобряване
              на услугата.
            </p>
            <p>Типични категории данни включват:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>данни за акаунта (имейл, дата на регистрация);</li>
              <li>
                технически логове и метаданни за достъп (IP, браузър, време на
                заявката);
              </li>
              <li>
                агрегирани метрики за ползване на платформата (брой регистрации,
                посещения на страници и др.).
              </li>
            </ul>
            <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Вашите права по GDPR
            </h2>
            <p>
              Като субект на данни имате право на достъп до личните си данни,
              корекция на неточности, изтриване (right to be forgotten) и
              преносимост. В платформата тези права са реализирани чрез
              функционалностите в акаунта (експорт/изтриване на акаунт) и чрез
              свързване с администратора при нужда.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Това резюме има информативен характер и не представлява юридически
              съвет. За пълни детайли вижте системната архитектура и свързаните
              Product/PRD документи.
            </p>
          </>
        ) : (
          <>
            <p>
              QA4Free collects and processes a minimal set of personal data as
              described in the PRD/MVP documentation – mainly your email address
              and some technical session information, needed for authentication,
              abuse prevention and improving the service.
            </p>
            <p>Typical categories of data include:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>account data (email, registration date);</li>
              <li>
                technical logs and access metadata (IP, browser, request time);
              </li>
              <li>
                aggregated usage metrics (number of registrations, page visits,
                etc.).
              </li>
            </ul>
            <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Your GDPR rights
            </h2>
            <p>
              As a data subject you have the right to access, rectify, erase
              (right to be forgotten) and export your personal data. In the
              platform these rights are implemented via account features
              (export/delete account) and by contacting the administrator when
              needed.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This summary is for information purposes only and does not
              constitute legal advice. For full details, refer to the system
              architecture and related Product/PRD documents.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
