import { BandSection } from "@/components/BandSection";
import { Hero } from "@/components/Hero";
import { Newsletter } from "@/components/Newsletter";
import { NextShow } from "@/components/NextShow";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getPhotos, getSiteCopy, localiseBand } from "@/lib/site-content";
import { ShowList } from "@/components/ShowList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/i18n";
import { fetchBandAppPublic } from "@/lib/band-app";
import { getShows } from "@/lib/shows";

/**
 * De homepage, één keer, voor beide talen.
 *
 * De routebestanden onder app/ zijn dun en roepen alleen dit aan met hun eigen
 * taal. Zo staat de pagina op één plek terwijl `/` en `/en` allebei echte routes
 * blijven.
 */
export async function HomePage({ locale }: { locale: Locale }) {
  const photos = await getPhotos();
  // De agenda komt uit de Band App. Is die even niet bereikbaar, dan staat de
  // pagina er gewoon: geen agenda is beter dan een foutmelding op de plek waar
  // iemand net een QR-code voor gescand heeft.
  const { upcoming, next, hasPlayed } = await getShows();
  // Dezelfde aanroep die getShows() doet. Next hergebruikt het antwoord binnen
  // één paginaweergave, dus dit is één verzoek aan de Band App en niet twee.
  const bandApp = await fetchBandAppPublic();
  const band = await localiseBand(bandApp, locale);
  const copy = await getSiteCopy(locale);

  return (
    <>
      <SiteHeader locale={locale} path="/" />
      <main id="main" tabIndex={-1} className="site-main">
        <Hero locale={locale} next={next} hasPlayed={hasPlayed} />
        <NextShow locale={locale} show={next} />
        <ShowList locale={locale} shows={upcoming} />
        <BandSection locale={locale} bio={band.bio} members={band.members} />
        <PhotoGrid locale={locale} photos={photos} />
        <Newsletter locale={locale} copy={copy.newsletter} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
