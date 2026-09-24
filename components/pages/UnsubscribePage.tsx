import Link from "next/link";

import { Page } from "@/components/Page";
import { localePath, type Locale } from "@/lib/i18n";
import { subscriberByToken } from "@/lib/newsletter";
import { getSiteCopy } from "@/lib/site-content";

/**
 * De pagina achter de link onderaan elke mail aan de lijst: afmelden, of ander
 * nieuws aan- of uitzetten.
 *
 * GEËXTRAPOLEERD, net als de bevestigingspagina ernaast: een kop, wat je nu
 * krijgt, en knoppen. Knoppen en geen links, en dat is geen formaliteit.
 * Mailscanners openen elke link in een mail om te kijken of hij veilig is; als
 * het openen van deze pagina al iets veranderde, stonden mensen eraf zonder het
 * te weten. De knoppen doen een POST, en die doet een scanner niet. Zie
 * app/api/nieuwsbrief/afmelden/route.ts.
 *
 * Na een klik komt dezelfde pagina terug met `?uitkomst=…`, en dan staat daar
 * wat er gebeurd is. Na een nieuwsinstelling staan de knoppen er weer onder,
 * zodat je ook meteen nog kunt afmelden.
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
  const subscriber = token ? await subscriberByToken(token) : null;

  const messages: Record<string, string> = {
    ok: copy.done,
    "news-on": copy.newsOnDone,
    "news-off": copy.newsOffDone,
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

  const choice = (action: string, label: string, strong = false) => (
    <form method="post" action="/api/nieuwsbrief/afmelden">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={
          strong
            ? "inline-flex min-h-12 cursor-pointer items-center bg-accent px-7 py-3 font-display text-16 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] hover:bg-accent-alt hover:text-inset"
            : "inline-flex min-h-12 cursor-pointer items-center border border-line-strong px-7 py-3 font-display text-16 font-bold tracking-wide12 text-primary uppercase transition-colors duration-[120ms] hover:border-primary"
        }
      >
        {label}
      </button>
    </form>
  );

  return (
    <Page locale={locale} path="/nieuwsbrief/afmelden" title={copy.title}>
      <section className="flex flex-col items-start gap-6">
        {message && (
          <p className="max-w-[560px] text-16 leading-[26px]">{message}</p>
        )}

        {subscriber ? (
          <>
            <p className="max-w-[560px] text-16 leading-[26px] text-muted">
              {subscriber.wantsNews ? copy.statusNews : copy.statusShows}
            </p>
            <div className="flex flex-wrap gap-3">
              {subscriber.wantsNews
                ? choice("news-off", copy.newsOff)
                : choice("news-on", copy.newsOn)}
            </div>
            <p className="max-w-[560px] text-16 leading-[26px]">
              {copy.question}
            </p>
            {choice("unsubscribe", copy.button, true)}
          </>
        ) : (
          <>
            {!message && (
              <p className="max-w-[560px] text-16 leading-[26px]">
                {copy.unknown}
              </p>
            )}
            {home}
          </>
        )}
      </section>
    </Page>
  );
}
