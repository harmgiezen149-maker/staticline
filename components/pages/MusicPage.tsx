import { Embed } from "@/components/Embed";
import { Empty, Page, Section } from "@/components/Page";
import { getSiteCopy, getSpotify } from "@/lib/site-content";
import { fetchBandAppPublic } from "@/lib/band-app";
import type { Locale } from "@/lib/i18n";

/**
 * De muziekpagina: waar je de band kunt horen, plus wat er gespeeld wordt.
 *
 * GEËXTRAPOLEERD. De setlist komt uit de Band App, uit de secties die daar als
 * openbaar zijn gemarkeerd — "Ideeën" staat daar standaard níet tussen, dus half
 * bekeken nummers belanden hier nooit.
 */
export async function MusicPage({ locale }: { locale: Locale }) {
  const spotify = await getSpotify();
  const copy = await getSiteCopy(locale);
  const data = await fetchBandAppPublic();

  const sections = (data?.setlistSections ?? []).filter(
    (section) => section.songs.length > 0,
  );

  const hasSomething = Boolean(spotify) || sections.length > 0;

  return (
    <Page
      locale={locale}
      path="/muziek"
      title={copy.music.title}
      intro={copy.music.intro}
    >
      {!hasSomething && <Empty>{copy.music.empty}</Empty>}

      {spotify && (
        <Section title={copy.music.spotify}>
          <Embed
            service="Spotify"
            title={copy.music.spotify}
            height={352}
            copy={copy.embed}
            src={`https://open.spotify.com/embed/${spotify.type}/${spotify.id}`}
          />
        </Section>
      )}

      {sections.map((section) => (
        <Section
          key={section.name}
          title={sections.length === 1 ? copy.music.setlist : section.name}
          note={copy.music.setlistNote}
        >
          <ol className="flex flex-col">
            {section.songs.map((song, index) => (
              <li
                key={`${song.title}-${index}`}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-3 border-b border-line py-3 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <span className="font-mono text-11 tracking-wide14 text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-18 font-semibold tracking-tight4 uppercase sm:text-22">
                  {song.title}
                </span>
                {song.artist && (
                  <span className="col-start-2 font-mono text-11 tracking-wide14 text-muted uppercase sm:col-start-3 sm:text-12">
                    {song.artist}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Section>
      ))}
    </Page>
  );
}
