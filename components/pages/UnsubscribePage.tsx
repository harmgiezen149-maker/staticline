import Link from "next/link";

import { Page } from "@/components/Page";
import { localePath, type Locale } from "@/lib/i18n";
import { getSiteCopy } from "@/lib/site-content";

/**
 * Waar de afmeldlink onderaan een nieuwsbrief op uitkomt.
 *
 * GEËXTRAPOLEERD, net als de bevestigingspagina ernaast: een kop, één zin en een
 * knop. De knop is geen formaliteit. Mailscanners openen elke link in een mail
 * om te kijken of hij veilig is; als het openen van deze pagina al afmeldde,
 * stonden mensen eraf zonder het te weten. De knop doet een POST, en die doet een
 * scanner niet. Zie app/api/nieuwsbrief/afmelden/route.ts.
 *
 * Na de klik komt dezelfde pagina terug met `?uitkomst=…`, en dan staat daar
 * wat er gebeurd is.
 */
export async function UnsubscribePage({
  locale,
  token,
  outcome,
}: {
  locale: Locale;
  token?: string;
  outcome?: string;
}) {
  const copy = (await getSiteCopy(locale)).unsubscribe;

  const messages: Record<string, string> = {
    ok: copy.done,
    unknown: copy.unknown,
    "no-token": copy.unknown,
    error: copy.error,
  };
  const message = outcome ? (messages[outcome] ?? copy.error) : null;

  const home = (
    <Link
      href={localePath(locale, "/")}
      className="inline-flex min-h-11 items-center border border-line-strong px-6 py-3 font-display text-15 font-bold tracking-wide12 text-primary uppercase transition-colors duration-[120ms] hover:border-primary"
    >
      {copy.home}
    </Link>
  );

  return (
    <Page locale={locale} path="/nieuwsbrief/afmelden" title={copy.title}>
      <section className="flex flex-col items-start gap-6">
        {message ? (
          <>
            <p className="max-w-[560px] text-16 leading-[26px]">{message}</p>
            {home}
          </>
        ) : token ? (
          <form
            method="post"
            action="/api/nieuwsbrief/afmelden"
            className="flex flex-col items-start gap-6"
          >
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="locale" value={locale} />
            <p className="max-w-[560px] text-16 leading-[26px]">
              {copy.question}
            </p>
            <button
              type="submit"
              className="inline-flex min-h-12 cursor-pointer items-center bg-accent px-7 py-3 font-display text-16 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] hover:bg-accent-alt hover:text-inset"
            >
              {copy.button}
            </button>
          </form>
        ) : (
          <>
            <p className="max-w-[560px] text-16 leading-[26px]">
              {copy.unknown}
            </p>
            {home}
          </>
        )}
      </section>
    </Page>
  );
}
