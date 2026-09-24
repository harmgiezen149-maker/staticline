import { formatShowDate, type Locale } from "@/lib/i18n";
import { getSiteCopy } from "@/lib/site-content";
import { isClickable, type Show, type ShowStatus } from "@/lib/shows";

/**
 * Kleur per status, uit de design-handoff. `text-faint` mag hier: het is een
 * mono-label van 12px in een secundaire rol, precies waarvoor dat token bedoeld is.
 */
const STATUS_COLOR: Record<ShowStatus, string> = {
  release: "text-accent-alt",
  tickets: "text-accent-alt",
  announced: "text-muted",
  soldout: "text-faint",
};

type Props = {
  locale: Locale;
  show: Show;
};

/**
 * Eén regel in de agenda.
 *
 * Wat erin staat, is alles wat er in het beheer bij een show hoort: datum en
 * aanvangstijd, de naam van de avond (als die er is), zaal en plaats, de regel
 * onder de zaalnaam, en de status met de ticketlink. Het ontwerp tekende alleen
 * datum, zaal, plaats en status; de rest is erbij gekomen op verzoek, in de
 * letters die de rij al had.
 *
 * Drie indelingen over dezelfde gegevens:
 *
 *   mobiel   datum · tijd over de volle breedte, daaronder de show en de status
 *   tablet   datum en tijd | de show, met zaal en plaats eronder | status
 *   desktop  datum en tijd | de show | plaats | status
 *
 * "De show" is de naam van de avond met de zaal eronder, of anders de zaal
 * zelf, met daaronder de regel uit het beheer. De posities staan expliciet per
 * breekpunt; automatische plaatsing zou op tablet de status naar een tweede
 * regel duwen.
 */
export async function ShowRow({ locale, show }: Props) {
  const copy = await getSiteCopy(locale);
  const clickable = isClickable(show);
  const name = show.title ?? show.venue;

  const content = (
    <>
      <span className="col-span-2 col-start-1 row-start-1 flex items-baseline gap-2 self-center sm:col-span-1 sm:flex-col sm:gap-1">
        <span className="font-mono text-11 tracking-wide16 text-muted uppercase sm:font-display sm:text-22 sm:font-semibold sm:tracking-tight4 sm:text-primary">
          {formatShowDate(show.date, locale)}
        </span>
        {show.time && (
          <span className="font-mono text-11 tracking-wide16 text-muted sm:text-12">
            <span aria-hidden="true" className="mr-2 sm:hidden">
              ·
            </span>
            <span data-decode data-decode-digits>
              {show.time}
            </span>
          </span>
        )}
      </span>

      <span className="col-start-1 row-start-2 flex min-w-0 flex-col gap-1 sm:col-start-2 sm:row-start-1">
        <span className="font-display text-18 font-semibold tracking-tight4 uppercase sm:text-22">
          {/* Twee lagen: de buitenste schuift bij hover opzij, over de binnenste
              tekent bij een uitverkochte show de doorhaallijn. */}
          <span className="show-row__venue">
            <span className="show-row__venue-text">{name}</span>
          </span>
        </span>

        {/* Zaal en plaats, als mono-regel. De zaal alleen als er een eigen
            naam van de avond boven staat — anders staat hij er al. De plaats
            heeft op desktop een eigen kolom. */}
        {(show.title || show.city) && (
          <span
            className={`flex flex-wrap gap-x-2 font-mono text-12 tracking-wide14 text-muted uppercase ${show.title ? "" : "lg:hidden"}`}
          >
            {show.title && <span>{show.venue}</span>}
            {show.city && (
              <span className="lg:hidden">
                {show.title && (
                  <span aria-hidden="true" className="mr-2">
                    ·
                  </span>
                )}
                {show.city}
              </span>
            )}
          </span>
        )}

        {show.note && (
          <span className="text-14 leading-[22px] text-muted">{show.note}</span>
        )}
      </span>

      {show.city && (
        <span
          className="hidden self-center font-mono text-12 tracking-wide14 text-muted uppercase lg:col-start-3 lg:row-start-1 lg:block"
          data-decode
        >
          {show.city}
        </span>
      )}

      <span
        className={`show-row__status col-start-2 row-start-2 self-baseline text-right font-mono text-10 tracking-wide14 uppercase sm:col-start-3 sm:row-start-1 sm:self-center sm:text-12 lg:col-start-4 ${STATUS_COLOR[show.status]}`}
      >
        <span
          className="show-row__status-text"
          data-decode
          {...(clickable ? { "data-scramble-target": "" } : {})}
        >
          {copy.status[show.status]}
        </span>
        {/* Bij hover maakt de status plaats voor een pijl: dit is een link naar
            kaartjes. Alleen op klikbare rijen, en voor een schermlezer niets. */}
        {clickable && (
          <span className="show-row__arrow" aria-hidden="true">
            ↗
          </span>
        )}
      </span>
    </>
  );

  const layout =
    "show-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 border-b border-line py-3 sm:grid-cols-[140px_minmax(0,1fr)_120px] sm:gap-4 sm:px-2 sm:py-4 lg:grid-cols-[160px_minmax(0,1fr)_200px_140px]";

  // Elke rij komt binnen met zijn lijn eerst en de inhoud erachteraan, 70 ms
  // na de vorige. Zie design/v2/MOTION.md §6.5.
  const motion = {
    "data-reveal": "",
    "data-stagger": "row",
    "data-status": show.status,
  };

  if (clickable) {
    return (
      <a
        href={show.ticketUrl}
        className={layout}
        {...motion}
        data-cursor={copy.motion.tickets}
        data-scramble-hover
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={layout}
      {...motion}
      // Een show zonder kaartjes is geen link en hoort ook niet als bedienbaar
      // aangekondigd te worden. Zo staat het in de handoff, en in v2 reageert
      // hij daarom ook nergens op: geen vulling, geen pijl, geen cursorlabel.
      aria-disabled="true"
    >
      {content}
    </div>
  );
}
