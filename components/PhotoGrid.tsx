import Image from "next/image";

import { getCopy } from "@/content";
import type { Locale } from "@/lib/i18n";

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
 * De fotosectie.
 *
 * De design-handoff schrijft vijf beelden voor met een duotone-behandeling op de
 * merkkleuren: een live shot staand (rood), een bandportret, een crowd (teal),
 * backstage en een gitaardetail. Die fotografie bestaat nog niet. De placeholders
 * zijn daarom niet leeg maar benoemd, zodat duidelijk is wat er hoort te komen —
 * precies zoals de referentie-implementatie het doet.
 */
export function PhotoGrid({ locale, photos = [], heading = true }: Props) {
  const copy = getCopy(locale);

  const cells: Array<Photo | { caption: string }> =
    photos.length > 0
      ? photos
      : copy.photos.placeholders.map((caption) => ({ caption }));

  return (
    <section
      id="photos"
      className="onthul relative bg-surface px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16"
    >
      <div className="grain-overlay opacity-35" aria-hidden="true" />

      <div className="relative flex flex-col gap-4 sm:gap-6">
        {heading && (
          <h2 className="font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase sm:text-[clamp(28px,4vw,44px)]">
            {copy.photos.heading}
          </h2>
        )}

        {/* `minmax(140px,auto)` op mobiel in plaats van een vaste 140px.
            De referentie-implementatie zet de eerste cel daar op een vaste hoogte
            van 200px binnen rijen van 140px; die cel loopt dan 60px over de
            volgende rij heen en de bijschriften schuiven over elkaar. Met een
            minimum in plaats van een vaste maat groeit de eerste rij mee naar
            200px en blijven alle maten uit het ontwerp intact. */}
        <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-2 gap-2 sm:auto-rows-[200px] lg:grid-cols-[2fr_1fr_1fr]">
          {cells.map((cell, index) => {
            const isPhoto = "src" in cell;
            return (
              <figure
                key={cell.caption}
                className={`relative m-0 flex items-end overflow-hidden border border-line bg-inset p-3 ${
                  index === 0
                    ? "col-span-2 h-[200px] sm:col-span-1 sm:row-span-2 sm:h-auto"
                    : ""
                } ${
                  // Het diagonale streeppatroon uit de referentie, zolang er geen
                  // fotografie is.
                  isPhoto
                    ? ""
                    : "bg-[repeating-linear-gradient(135deg,#1C2126_0_10px,#12161A_10px_20px)]"
                }`}
              >
                {isPhoto && (
                  <Image
                    src={cell.src}
                    alt={cell.alt}
                    fill
                    sizes="(min-width: 1025px) 33vw, 50vw"
                    className="object-cover"
                  />
                )}
                <figcaption className="relative font-mono text-11 tracking-wide10 text-faint">
                  {cell.caption}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
