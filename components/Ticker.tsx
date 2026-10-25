import Link from "next/link";

import { formatDayMonth, formatShowDateLong, formatYear, localePath, type Locale } from "@/lib/i18n";
import { getSiteCopy } from "@/lib/site-content";
import type { Show } from "@/lib/shows";

type Props = {
  locale: Locale;
  next: Show | null;
};

/**
 * De schuine looptekst onder de hero, alleen in het Microduck-ontwerp (zie
 * lib/design.ts).
 *
 * GEËXTRAPOLEERD, niet ontworpen: naar de gele strook op de Microduck-pagina,
 * in rood en crème met zwarte blokjes ertussen. Erin de volgende show uit de
 * Band App, "Boek ons" en de korte ondertitel; zonder geplande show alleen die
 * laatste twee. De hele strook is één link naar de agenda.
 *
 * De tekst staat er vier keer achter elkaar, zodat het doorlopen naadloos
 * rondgaat, ook op een scherm dat breder is dan één keer de tekst; de herhaling
 * is voor een schermlezer verborgen, en die leest alleen het label van de link.
 * Het lopen zelf is CSS (`.ticker` in styles/microduck.css) en alleen onder
 * `.motion`: zonder JavaScript of met minder beweging staat de strook stil.
 */
export async function Ticker({ locale, next }: Props) {
  const copy = await getSiteCopy(locale);
  const t = copy.microduck.ticker;

  const items = [
    ...(next
      ? [t.next, `${next.title ?? next.venue} · ${formatDayMonth(next.date)}.${formatYear(next.date)}`]
      : [t.none]),
    copy.hero.ctaBook,
    copy.hero.subShort,
  ];
  const label = next
    ? `${t.next}: ${next.title ?? next.venue}, ${formatShowDateLong(next.date, locale)}. ${t.label}`
    : t.label;

  const run = (hidden: boolean) => (
    <span className="ticker__run" aria-hidden={hidden || undefined}>
      {items.map((item, index) => (
        <span key={index} className="ticker__item">
          <span>{item}</span>
          <span className="ticker__blok" aria-hidden="true">
            ■
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="ticker">
      <Link href={localePath(locale, "/agenda")} className="ticker__strook" aria-label={label}>
        <span className="ticker__track">
          {run(false)}
          {run(true)}
          {run(true)}
          {run(true)}
        </span>
      </Link>
    </div>
  );
}
