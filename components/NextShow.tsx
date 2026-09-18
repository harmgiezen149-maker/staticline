import { getCopy } from "@/content";
import {
  formatDayMonth,
  formatDayMonthYear,
  formatTime,
  formatYear,
  type Locale,
} from "@/lib/i18n";
import { isClickable, type Show } from "@/lib/shows";

type Props = {
  locale: Locale;
  show: Show | null;
};

/**
 * De accentbalk met de eerstvolgende show.
 *
 * Dit is de reden dat de site bestaat: de volgende show en de manier om de band
 * te bereiken zijn nooit meer dan één scherm weg. Daarom staat hij direct onder
 * de hero en in de enige volvlakke accentkleur op de pagina.
 */
export function NextShow({ locale, show }: Props) {
  const copy = getCopy(locale);

  if (!show) {
    // Lege staat uit de handoff: de balk blijft staan, de inhoud verandert. Een
    // verdwenen balk laat de pagina er kapot uitzien; een lege agenda is gewoon
    // een feit.
    return (
      <section
        aria-label={copy.nextShow.label}
        className="bg-accent px-5 py-5 text-on-accent sm:px-8"
      >
        <p className="font-mono text-11 tracking-wide22 uppercase opacity-85">
          {copy.nextShow.label}
        </p>
        <p className="font-display text-20 font-bold tracking-tight3 uppercase sm:text-30">
          {copy.nextShow.none}
        </p>
      </section>
    );
  }

  const venueLine = [show.venue, show.city].filter(Boolean).join(", ");

  return (
    <section
      aria-label={copy.nextShow.label}
      className="flex flex-col gap-1 bg-accent p-5 text-on-accent sm:flex-row sm:gap-0 sm:p-0"
    >
      <div className="flex flex-col justify-center sm:border-r sm:border-[rgba(13,15,18,0.35)] sm:px-8 sm:py-6">
        <p className="font-mono text-11 tracking-wide22 uppercase opacity-85">
          {copy.nextShow.label}
        </p>
        {/* Op mobiel staat het jaar in het datumblok zelf, omdat de metaregel
            eronder daar wegvalt. */}
        <p className="font-display text-[40px] leading-[0.95] font-bold sm:hidden">
          {formatDayMonthYear(show.date)}
        </p>
        <p className="hidden font-display text-64 leading-[0.95] font-bold sm:block">
          {formatDayMonth(show.date)}
        </p>
        <p className="hidden font-mono text-12 tracking-wide18 sm:block">
          {formatYear(show.date)} · {formatTime(show.date)}
        </p>
      </div>

      <div className="flex flex-col justify-center gap-1 sm:px-8 sm:py-6">
        <h2 className="font-display text-20 font-bold tracking-tight3 uppercase sm:text-30">
          {venueLine}
        </h2>
        {/* De noot verdwijnt op mobiel — zo staat het in het ontwerp. */}
        {show.note && (
          <p className="hidden text-14 leading-[22px] opacity-92 sm:block">
            {show.note}
          </p>
        )}
      </div>

      {isClickable(show) && (
        <a
          href={show.ticketUrl}
          className="mt-3 flex w-full items-center justify-center bg-inset py-3 font-display text-14 font-bold tracking-wide12 text-primary uppercase transition-colors duration-[120ms] hover:bg-black sm:mt-0 sm:ml-auto sm:w-auto sm:px-10 sm:py-0 sm:text-16"
        >
          {copy.nextShow.tickets}
        </a>
      )}
    </section>
  );
}
