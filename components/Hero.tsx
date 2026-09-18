import Image from "next/image";

import { Button } from "./Button";
import { getCopy } from "@/content";
import { formatShowDateLong, localePath, type Locale } from "@/lib/i18n";
import type { Show } from "@/lib/shows";
import { getText } from "@/lib/site-content";

import background from "@/public/assets/background.jpg";
import wordmark from "@/public/assets/staticline-wordmark.png";

type Props = {
  locale: Locale;
  next: Show | null;
  /** Of er al gespeelde shows zijn; bepaalt of de kicker "eerste" of "volgende" zegt. */
  hasPlayed: boolean;
};

export async function Hero({ locale, next, hasPlayed }: Props) {
  const copy = getCopy(locale);

  // De twee ondertitels zijn via /beheer aan te passen. Staat er niets, dan komt
  // de tekst uit content/ — zie lib/site-content.ts.
  const [sub, subShort] = await Promise.all([
    getText("hero.sub", locale, copy.hero.sub),
    getText("hero.subShort", locale, copy.hero.subShort),
  ]);

  // Het ontwerp zet hier vast "Eerste show — 10 november 2026". Dat klopt zolang
  // de band nog niets gespeeld heeft, en daarna niet meer. De tekst volgt daarom
  // de agenda in plaats van een datum die iemand moet onthouden bij te werken.
  const kicker = !next
    ? copy.hero.kickerNone
    : `${hasPlayed ? copy.hero.kickerNext : copy.hero.kickerFirst} — ${formatShowDateLong(next.date, locale)}`;

  return (
    <section
      id="top"
      className="relative isolate px-5 pt-10 pb-7 sm:px-8 sm:pt-14 sm:pb-10 lg:px-12 lg:pt-18 lg:pb-12"
    >
      <Image
        src={background}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        className="-z-10 object-cover"
      />

      {/* Leesbaarheidsverloop. Het enige verloop in het hele ontwerp; op mobiel
          sterker, omdat de tekst daar dichter op de drukke plaat staat. */}
      <div className="absolute inset-0 -z-10 bg-linear-[180deg,rgba(13,15,18,0.4),rgba(13,15,18,0.95)] lg:bg-linear-[180deg,rgba(13,15,18,0.45),rgba(13,15,18,0.92)]" />

      {/* Korrel. Tilende 256×256 PNG in plaats van een paginagrote afbeelding. */}
      <div className="grain-overlay -z-10 opacity-50" aria-hidden="true" />

      <div className="relative flex flex-col gap-4 lg:gap-6">
        <p className="font-mono text-12 tracking-wide28 text-accent-alt uppercase">
          {kicker}
        </p>

        {/* Het wordmark wordt nooit hertekend, herkleurd of uitgerekt. Dit is het
            aangeleverde bestand, op de breedtes uit de handoff: 720px op desktop,
            520px op tablet, volle breedte op mobiel. */}
        <Image
          src={wordmark}
          alt={copy.hero.wordmarkAlt}
          priority
          sizes="(min-width: 1025px) 720px, (min-width: 641px) 520px, 100vw"
          className="w-full drop-shadow-[0_12px_40px_rgba(0,0,0,0.6)] sm:w-[520px] lg:w-[720px]"
        />

        {/* Twee varianten van dezelfde zin: het ontwerp schrijft op mobiel een
            kortere subkop voor. Beide staan in de HTML en CSS kiest — dat is een
            paar honderd bytes, en het alternatief is een layout shift of JS. */}
        <p className="max-w-[560px] text-14 leading-[22px] sm:hidden">
          {subShort}
        </p>
        <p className="hidden max-w-[560px] text-18 leading-[28px] sm:block">
          {sub}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            href={localePath(locale, "/boeken")}
            variant="primary"
            className="flex w-full py-3.5 text-15 sm:inline-flex sm:w-auto sm:px-7 sm:py-4 sm:text-16"
          >
            {copy.hero.ctaBook}
          </Button>
          {/* Op mobiel toont het ontwerp alleen de primaire knop. */}
          <Button
            href={localePath(locale, "/#shows")}
            variant="ghost"
            className="hidden px-7 py-4 text-16 sm:inline-flex"
          >
            {copy.hero.ctaShows}
          </Button>
        </div>
      </div>
    </section>
  );
}
