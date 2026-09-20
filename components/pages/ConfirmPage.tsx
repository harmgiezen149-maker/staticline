import Link from "next/link";

import { Page } from "@/components/Page";
import { localePath, type Locale } from "@/lib/i18n";
import { confirmSubscriber } from "@/lib/newsletter";
import { getSiteCopy } from "@/lib/site-content";

/**
 * Waar de bevestigingslink uit de nieuwsbriefmail op uitkomt.
 *
 * GEËXTRAPOLEERD. Bewust een gewone pagina met kop en voet en niets bijzonders:
 * iemand komt hier vanuit zijn mail, ziet één zin, en klikt door naar de site.
 * Een eigen ontwerp voor een pagina die je één keer een seconde ziet is verspilde
 * moeite.
 *
 * De vier uitkomsten staan in content/*.ts. Ze zeggen alle vier iets anders,
 * omdat "deze link is al gebruikt" en "er ging iets mis" verschillende dingen
 * zijn om te doen: de eerste is klaar, de tweede kun je opnieuw proberen.
 */
export async function ConfirmPage({
  locale,
  token,
}: {
  locale: Locale;
  token?: string;
}) {
  const copy = (await getSiteCopy(locale)).confirm;
  const result = await confirmSubscriber(token);

  const message = {
    ok: copy.ok,
    unknown: copy.unknown,
    "no-token": copy.noToken,
    error: copy.error,
  }[result];

  return (
    <Page locale={locale} path="/nieuwsbrief/bevestigen" title={copy.title}>
      <section className="flex flex-col items-start gap-6">
        <p className="max-w-[560px] text-16 leading-[26px]">{message}</p>
        <Link
          href={localePath(locale, "/")}
          className="inline-flex min-h-11 items-center border border-line-strong px-6 py-3 font-display text-15 font-bold tracking-wide12 text-primary uppercase transition-colors duration-[120ms] hover:border-primary"
        >
          {copy.home}
        </Link>
      </section>
    </Page>
  );
}
