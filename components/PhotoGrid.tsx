import Image from "next/image";

import type { Locale } from "@/lib/i18n";
import { getSiteCopy } from "@/lib/site-content";

export type Photo = {
  src: string;
  alt: string;
  caption: string;
};

type Props = {
  locale: Locale;
  /**
   * De vijf beelden. Nog niet geleverd — zolang deze lijst leeg is, toont de
   * sectie de placeholders uit het ontwerp met de omschrijving van wat er komt.
   */
  photos?: Photo[];
  /**
   * Of de sectiekop meegerenderd wordt. Op de fotopagina staat de titel al als
   * paginakop, en twee keer "Foto's" onder elkaar leest als een fout.
   */
  heading?: boolean;
};

/**
 * De placeholders uit de v2-handoff: abstracte duotone-texturen, gemaakt uit de
 * hero-achtergrond. Ze staan er zodat het gedrag van de sectie te zien is —
 * gedempt in rust, in kleur bij hover — zolang de echte fotografie ontbreekt.
 * Het bijschrift zegt wat er op die plek hoort te komen. Wie in /beheer foto's
 * uploadt, vervangt ze allemaal tegelijk.
 */
const PLACEHOLDERS = [1, 2, 3, 4, 5].map((i) => `/assets/placeholders/placeholder-${i}.webp`);

/**
 * De fotosectie.
 *
 * De design-handoff schrijft vijf beelden voor met een duotone-behandeling op de
 * merkkleuren: een live shot staand (rood), een bandportret, een crowd (teal),
 * backstage en een gitaardetail. Die fotografie bestaat nog niet.
 *
 * v2 geeft elke foto een entree (vijf banden trekken weg, de foto zakt van
 * 1,08 naar 1), zoekerhoeken bij hover, en een knop over de hele cel die de
 * lightbox opent. Zonder JavaScript doet die knop niets en staat de foto
 * gewoon in het raster. Zie design/v2/MOTION.md §6.6.
 */
export async function PhotoGrid({ locale, photos = [], heading = true }: Props) {
  const copy = await getSiteCopy(locale);

  const cells: Photo[] =
    photos.length > 0
      ? photos
      : copy.photos.placeholders.map((caption, i) => ({
          src: PLACEHOLDERS[i % PLACEHOLDERS.length],
          alt: `${caption} (placeholder)`,
          caption,
        }));

  return (
    <section
      id="photos"
      className="relative bg-surface px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16"
    >
      <div className="korrel opacity-35" aria-hidden="true" />

      <div className="relative flex flex-col gap-4 sm:gap-6">
        {heading && (
          <h2
            className="font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase sm:text-[clamp(28px,4vw,44px)]"
            data-reveal="mask"
          >
            <span className="mask-line">
              <span>{copy.photos.heading}</span>
            </span>
          </h2>
        )}

        {/* `minmax(140px,auto)` op mobiel in plaats van een vaste 140px.
            De referentie-implementatie zet de eerste cel daar op een vaste hoogte
            van 200px binnen rijen van 140px; die cel loopt dan 60px over de
            volgende rij heen en de bijschriften schuiven over elkaar. Met een
            minimum in plaats van een vaste maat groeit de eerste rij mee naar
            200px en blijven alle maten uit het ontwerp intact. */}
        <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-2 gap-2 sm:auto-rows-[200px] lg:grid-cols-[2fr_1fr_1fr]">
          {cells.map((cell, index) => (
            <figure
              key={`${cell.src}-${index}`}
              className={`photo relative m-0 flex items-end overflow-hidden border border-line bg-inset p-3 ${
                index === 0 ? "col-span-2 h-[200px] sm:col-span-1 sm:row-span-2 sm:h-auto" : ""
              }`}
              data-reveal=""
              data-stagger="photo"
              data-scramble-hover
            >
              <Image
                src={cell.src}
                alt={cell.alt}
                fill
                sizes={index === 0 ? "(min-width: 1025px) 50vw, 100vw" : "(min-width: 1025px) 25vw, 50vw"}
                className="photo__img -z-10 object-cover"
              />

              {/* Vijf banden, elk met een eigen vertraging, die bij binnenkomst
                  afwisselend naar links en rechts wegtrekken. */}
              <span className="photo__bands" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((band) => (
                  <i key={band} style={{ "--band-i": band } as React.CSSProperties} />
                ))}
              </span>
              <span className="photo__frame" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>

              {/* Het bijschrift staat sinds v2 op een donker vlak en in
                  --text-muted in plaats van --text-faint: op een echte foto is
                  het anders niet te lezen. */}
              <figcaption
                className="relative bg-[rgba(9,11,13,0.72)] px-1.5 py-0.5 font-mono text-11 tracking-wide10 text-muted"
                data-scramble-target
              >
                {cell.caption}
              </figcaption>

              <button
                type="button"
                className="photo__button absolute inset-0 z-3 h-full w-full border-0 bg-transparent p-0"
                data-lightbox
                data-cursor={copy.motion.view}
                aria-label={`${copy.motion.enlarge}: ${cell.caption}`}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
