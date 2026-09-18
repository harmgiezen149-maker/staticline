import { Empty, Page, Section } from "@/components/Page";
import { ShowMap } from "@/components/ShowMap";
import { ShowRow } from "@/components/ShowRow";
import { getCopy } from "@/content";
import type { Locale } from "@/lib/i18n";
import { getShows } from "@/lib/shows";

/**
 * De volledige agenda: komende shows, het archief en een kaart.
 *
 * GEËXTRAPOLEERD. De showrij is wél ontworpen en wordt hier hergebruikt, zodat de
 * agenda er hetzelfde uitziet als het blok op de homepage.
 */
export async function AgendaPage({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const { upcoming, past } = await getShows();

  const withCoordinates = upcoming.filter(
    (show) => show.lat !== null && show.lng !== null,
  );

  return (
    <Page
      locale={locale}
      path="/agenda"
      title={copy.agenda.title}
      intro={copy.agenda.intro}
    >
      <Section title={copy.agenda.upcoming} id="upcoming">
        {upcoming.length === 0 ? (
          <Empty>{copy.shows.empty}</Empty>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-0">
            {upcoming.map((show) => (
              <ShowRow key={show.id} locale={locale} show={show} />
            ))}
          </div>
        )}
      </Section>

      <Section title={copy.agenda.map}>
        {withCoordinates.length === 0 ? (
          <Empty>{copy.agenda.mapEmpty}</Empty>
        ) : (
          <ShowMap shows={withCoordinates} />
        )}
      </Section>

      <Section title={copy.agenda.archive} id="archive">
        {past.length === 0 ? (
          <Empty>{copy.agenda.archiveEmpty}</Empty>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-0">
            {past.map((show) => (
              <ShowRow key={show.id} locale={locale} show={show} />
            ))}
          </div>
        )}
      </Section>
    </Page>
  );
}
