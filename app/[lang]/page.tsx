import { notFound } from "next/navigation";

import { Hero } from "@/components/Hero";
import { NextShow } from "@/components/NextShow";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ShowList } from "@/components/ShowList";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isLocale } from "@/lib/i18n";
import { getShows } from "@/lib/shows";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  // De agenda komt uit de Band App. Is die even niet bereikbaar, dan staat de
  // pagina er gewoon: geen agenda is beter dan een foutmelding op de plek waar
  // iemand net een QR-code voor gescand heeft.
  const { upcoming, next, hasPlayed } = await getShows();

  return (
    <>
      <SiteHeader locale={lang} path="/" />
      <main>
        <Hero locale={lang} next={next} hasPlayed={hasPlayed} />
        <NextShow locale={lang} show={next} />
        <ShowList locale={lang} shows={upcoming} />
        <PhotoGrid locale={lang} />
      </main>
      <SiteFooter locale={lang} />
    </>
  );
}
