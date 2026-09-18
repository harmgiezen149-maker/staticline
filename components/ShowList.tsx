import Link from "next/link";

import { ShowRow } from "./ShowRow";
import { getCopy } from "@/content";
import { localePath, type Locale } from "@/lib/i18n";
import type { Show } from "@/lib/shows";

type Props = {
  locale: Locale;
  shows: Show[];
};

/** Het ontwerp toont op mobiel drie shows met daaronder een link naar de agenda. */
const MOBILE_LIMIT = 3;

/**
 * "1 datum" tegenover "5 data".
 *
 * Intl.PluralRules kent de regels van beide talen; zelf op `=== 1` testen werkt
 * hier toevallig ook, maar dan staat de aanname in de code in plaats van in de
 * taal. Nederlands en Engels hebben allebei alleen `one` en `other`.
 */
function formatCount(
  locale: Locale,
  forms: { one: string; other: string },
  count: number,
): string {
  const rule = new Intl.PluralRules(locale).select(count);
  const template = rule === "one" ? forms.one : forms.other;
  return template.replace("{count}", String(count));
}

export function ShowList({ locale, shows }: Props) {
  const copy = getCopy(locale);

  return (
    <section
      id="shows"
      className="onthul flex flex-col gap-3 px-5 py-6 sm:gap-6 sm:px-8 sm:py-12 lg:px-12 lg:py-16"
    >
      <div className="streep flex items-baseline gap-4 border-b-2 border-primary pb-2 [--streep-dikte:2px] [--streep-kleur:var(--color-primary)] sm:pb-3">
        <h2 className="font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase sm:text-[clamp(28px,4vw,44px)]">
          {copy.shows.heading}
        </h2>
        <span className="hidden font-mono text-12 tracking-wide18 text-faint sm:inline">
          {formatCount(locale, copy.shows.count, shows.length)}
        </span>
      </div>

      {shows.length === 0 ? (
        <p className="text-14 text-muted sm:text-16">{copy.shows.empty}</p>
      ) : (
        <>
          {shows.map((show, index) => (
            <div
              key={show.id}
              // Boven de vierde show op mobiel valt de rij weg; op tablet en
              // groter staan ze er allemaal. Verbergen in CSS en niet in JS,
              // zodat de volledige agenda in de HTML staat voor zoekmachines en
              // de indeling niet verspringt als het scherm draait.
              className={index >= MOBILE_LIMIT ? "hidden sm:block" : undefined}
            >
              <ShowRow locale={locale} show={show} />
            </div>
          ))}

          {shows.length > MOBILE_LIMIT && (
            <Link
              href={localePath(locale, "/agenda")}
              className="pt-1 font-mono text-11 tracking-wide16 text-accent-alt uppercase sm:hidden"
            >
              {copy.shows.viewAll} →
            </Link>
          )}
        </>
      )}
    </section>
  );
}
