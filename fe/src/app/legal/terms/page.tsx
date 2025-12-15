import { normalizeLang, type SupportedLang } from "../../../i18n/config";
import { t } from "../../../i18n/t";

type LegalPageSearchParams = {
  lang?: string;
};

export default async function TermsPage({
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
        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
          Legal / Terms
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t(lang, "common", "legalTermsTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          {t(lang, "common", "legalTermsIntro")}
        </p>
      </header>

      <section className="space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
        {isBg ? (
          <>
            <p>
              Като използвате BeeLMS, приемате, че платформата се предоставя
              с учебна цел и „както е“ (as is), без гаранции за пълнота или
              липса на грешки в съдържанието.
            </p>
            <p>Основни принципи при ползване на платформата:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                не използвайте BeeLMS за злонамерени атаки срещу други системи
                или потребители;
              </li>
              <li>
                не публикувайте съдържание, което нарушава авторски права или
                лични данни на трети лица;
              </li>
              <li>
                спазвайте добри практики при тестване и не изпращайте
                прекомерно количество заявки към Training API или други
                публични ресурси.
              </li>
            </ul>
            <p>
              Администраторите си запазват правото да ограничават достъпа на
              потребители, които системно нарушават тези правила или опитват да
              заобиколят защитите на системата.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Това резюме е с информативен характер и не замества пълни
              юридически условия. Целта му е да постави рамка за коректно и
              етично използване на BeeLMS като учебна среда.
            </p>
          </>
        ) : (
          <>
            <p>
              By using BeeLMS you acknowledge that the platform is provided for
              learning purposes and on an &quot;as is&quot; basis, without
              guarantees about completeness or the absence of errors in the
              content.
            </p>
            <p>Core principles when using the platform:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                do not use BeeLMS to perform malicious attacks against other
                systems or users;
              </li>
              <li>
                do not publish content that violates copyright or exposes
                personal data of third parties;
              </li>
              <li>
                follow good testing practices and avoid sending excessive
                traffic to the Training API or other public resources.
              </li>
            </ul>
            <p>
              Administrators may restrict access for users who repeatedly break
              these rules or attempt to bypass the security controls of the
              system.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This summary is for information purposes only and does not replace
              a full set of legal terms. Its goal is to set expectations for
              fair and ethical use of BeeLMS as a learning environment.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
