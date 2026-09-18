import { Hero } from "@/components/Hero";
import { NextShow } from "@/components/NextShow";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ShowList } from "@/components/ShowList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/i18n";
import { getShows } from "@/lib/shows";

/**
 * De homepage, één keer, voor beide talen.
 *
 * De routebestanden onder app/ zijn dun en roepen alleen dit aan met hun eigen
 * taal. Zo staat de pagina op één plek terwijl `/` en `/en` allebei echte routes
 * blijven.
 */
export async function HomePage({ locale }: { locale: Locale }) {
  // De agenda komt uit de Band App. Is die even niet bereikbaar, dan staat de
  // pagina er gewoon: geen agenda is beter dan een foutmelding op de plek waar
  // iemand net een QR-code voor gescand heeft.
  const { upcoming, next, hasPlayed } = await getShows();

  return (
    <>
      <SiteHeader locale={locale} path="/" />
      <main>
        <Hero locale={locale} next={next} hasPlayed={hasPlayed} />
        <NextShow locale={locale} show={next} />
        <ShowList locale={locale} shows={upcoming} />
        <PhotoGrid locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
