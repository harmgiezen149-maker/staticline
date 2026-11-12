import Link from "next/link";

import { Button } from "@/components/Button";
import { KopTekst } from "@/components/Kop";
import { getGrunge } from "@/content/grunge";
import { localePath, type Locale } from "@/lib/i18n";
import { getSiteCopy } from "@/lib/site-content";

/**
 * Het instapblok op de homepage naar /grunge ("Waar we vandaan komen").
 *
 * GEËXTRAPOLEERD, naar het ontwerp van de grunge-pagina op claude.ai. Tussen de
 * bandsectie en de foto's: na "wie speelt er" komt "waar komt het vandaan".
 * Korrel achter de grote kop, zoals in de hero; de drie kanalen zijn gewone
 * links naar die plek op de pagina.
 */
export async function OriginsTeaser({ locale }: { locale: Locale }) {
  const copy = await getSiteCopy(locale);
  const g = getGrunge(locale);
  const page = localePath(locale, "/grunge");
  const channels = [
    ["02", "seattle", g.chapters.seattle.title, g.teaser.seattle],
    ["05", "spot", g.chapters.spot.title, g.teaser.spot],
    ["11", "top12", g.chapters.top12.title, g.teaser.top12],
  ] as const;

  return (
    <section
      id="waar-we-vandaan-komen"
      className="relative isolate grid items-center gap-8 overflow-hidden border-y border-line px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:px-12 lg:py-24"
    >
      <div className="korrel -z-10 opacity-35" aria-hidden="true" />
      <div className="flex flex-col gap-5" data-reveal="rise">
        <p className="font-mono text-12 tracking-wide8 text-accent-alt uppercase" data-decode>
          {copy.origins.kicker}
        </p>
        <h2 className="font-display text-[clamp(72px,12vw,140px)] leading-[0.85] font-bold uppercase">
          <KopTekst text={copy.origins.title} />
        </h2>
        <p className="max-w-[520px] text-16 leading-[26px] sm:text-18 sm:leading-[28px]">{copy.origins.text}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button href={page} variant="primary" className="flex min-h-12 px-7 py-3.5 text-15 sm:inline-flex sm:text-16">
            {copy.origins.cta}
          </Button>
          <Button href={`${page}#top12`} variant="ghost" className="flex min-h-12 px-7 py-3.5 text-15 sm:inline-flex sm:text-16">
            {copy.origins.ctaList}
          </Button>
        </div>
      </div>
      <ol className="flex flex-col gap-2" data-reveal="rise">
        {channels.map(([index, id, title, line]) => (
          <li key={id}>
            <Link
              href={`${page}#${id}`}
              className={`grid grid-cols-[64px_1fr] items-center gap-4 px-5 py-4 transition-colors duration-[120ms] ${
                id === "top12" ? "bg-accent text-on-accent hover:bg-accent-hover" : "border border-line bg-surface hover:border-line-strong"
              }`}
            >
              <span className={`font-mono text-14 ${id === "top12" ? "" : "text-accent-alt"}`}>CH {index}</span>
              <span>
                <b className="block font-display text-20 font-semibold uppercase sm:text-22">{title}</b>
                <span className={`text-14 ${id === "top12" ? "" : "text-muted"}`}>{line}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
