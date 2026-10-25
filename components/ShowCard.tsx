import { formatDayMonth, formatYear, type Locale } from "@/lib/i18n";
import { getSiteCopy } from "@/lib/site-content";
import { isClickable, type Show } from "@/lib/shows";

type Props = {
  locale: Locale;
  show: Show;
  /** Plek in de rij: de eerste kaart is de eerstvolgende show en krijgt rood. */
  index: number;
  hasPlayed: boolean;
};

/**
 * Een show als kaart, alleen in het Microduck-ontwerp (zie lib/design.ts).
 *
 * GEËXTRAPOLEERD, niet ontworpen: naar de "packs" op de Microduck-pagina, in de
 * kleuren van de site. Een kop met een stippenraster en de naam van de avond of
 * de zaal, daaronder datum, tijd en plaats, de regel uit het beheer, en bij
 * kaartverkoop de ticketknop. De status staat als schuine sticker op de hoek.
 * Het uiterlijk staat in styles/microduck.css onder `.show-kaart`.
 *
 * Dezelfde gegevens als een rij in de agenda (ShowRow); niets uit het beheer
 * valt weg.
 */
export async function ShowCard({ locale, show, index, hasPlayed }: Props) {
  const copy = await getSiteCopy(locale);
  const t = copy.microduck.card;
  const name = show.title ?? show.venue;
  const kicker = index > 0 ? t.show : hasPlayed ? t.next : t.first;
  const where = [show.title ? show.venue : "", show.city].filter(Boolean).join(", ");
  const meta = [show.time, where].filter(Boolean).join(" · ");
  const note = show.note || (show.status === "soldout" ? t.soldout : show.status === "announced" ? t.announced : "");

  return (
    <article
      className={`show-kaart${index === 0 ? " show-kaart--eerst" : ""}`}
      data-status={show.status}
      data-reveal="rise"
    >
      <div className="show-kaart__kop">
        <p className="show-kaart__kicker">{kicker}</p>
        <h3 className="show-kaart__naam">{name}</h3>
      </div>
      <div className="show-kaart__body">
        <p className="show-kaart__datum">
          {formatDayMonth(show.date)} <span>{formatYear(show.date)}</span>
        </p>
        {meta && <p className="show-kaart__meta">{meta}</p>}
        {note && <p className="show-kaart__noot">{note}</p>}
        {isClickable(show) && (
          <a
            href={show.ticketUrl}
            data-cursor={copy.motion.tickets}
            className="btn btn--primary show-kaart__knop font-display font-bold tracking-wide12 uppercase"
          >
            <span className="btn__label">{copy.nextShow.tickets}</span>
          </a>
        )}
      </div>
      <p className="show-kaart__sticker">{copy.status[show.status]}</p>
    </article>
  );
}
