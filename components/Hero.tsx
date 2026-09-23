import Image from "next/image";

import { Button } from "./Button";
import { formatShowDateLong, localePath, type Locale } from "@/lib/i18n";
import type { Show } from "@/lib/shows";
import { getHeroBackground, getSiteCopy, getWordmark } from "@/lib/site-content";


type Props = {
  locale: Locale;
  next: Show | null;
  /** Of er al gespeelde shows zijn; bepaalt of de kicker "eerste" of "volgende" zegt. */
  hasPlayed: boolean;
};

export async function Hero({ locale, next, hasPlayed }: Props) {
  const copy = await getSiteCopy(locale);

  // De ondertitels zitten al in `copy`: getSiteCopy legt aanpassingen uit
  // /beheer/inhoud over de tekst uit content/ heen.
  const [background, wordmark] = await Promise.all([getHeroBackground(), getWordmark()]);
  const { sub, subShort } = copy.hero;

  // Het ontwerp zet hier vast "Eerste show — 10 november 2026". Dat klopt zolang
  // de band nog niets gespeeld heeft, en daarna niet meer. De tekst volgt daarom
  // de agenda in plaats van een datum die iemand moet onthouden bij te werken.
  const kicker = !next
    ? copy.hero.kickerNone
    : `${hasPlayed ? copy.hero.kickerNext : copy.hero.kickerFirst} — ${formatShowDateLong(next.date, locale)}`;

  return (
    <section
      id="top"
      className="hero relative isolate overflow-hidden px-5 pt-10 pb-7 sm:px-8 sm:pt-14 sm:pb-10 lg:px-12 lg:pt-18 lg:pb-12"
    >
      {/* De achtergrond staat in een eigen laag die 12% hoger is dan de hero,
          zodat hij bij het scrollen kan achterblijven zonder dat er ergens een
          rand zichtbaar wordt. Zie `.hero__bg` in styles/motion.css. */}
      <div className="hero__bg" aria-hidden="true">
        <Image
          src={background.src}
          alt=""
          fill
          priority
          sizes="100vw"
          // De vervaging tijdens het laden komt uit de import en bestaat alleen
          // voor het bestand uit de code. Een geüpload bestand heeft er geen, en
          // `placeholder="blur"` zonder `blurDataURL` is een fout.
          {...(background.blurDataURL
            ? { placeholder: "blur" as const, blurDataURL: background.blurDataURL }
            : {})}
          className="object-cover"
        />
      </div>

      {/* Leesbaarheidsverloop. Het enige verloop in het hele ontwerp; op mobiel
          sterker, omdat de tekst daar dichter op de drukke plaat staat. */}
      <div className="absolute inset-0 -z-10 bg-linear-[180deg,rgba(13,15,18,0.4),rgba(13,15,18,0.95)] lg:bg-linear-[180deg,rgba(13,15,18,0.45),rgba(13,15,18,0.92)]" />

      {/* Levende korrel: de bestaande 256×256-tegel, die sinds v2 acht keer per
          seconde verspringt. Zie `.korrel` in styles/motion.css. */}
      <div className="korrel -z-10 opacity-50" aria-hidden="true" />

      <div className="hero__inner relative z-1 flex flex-col gap-4 lg:gap-6">
        <p
          className="hero__kicker font-mono text-12 tracking-wide28 text-accent-alt uppercase"
          data-decode
          data-decode-manual
        >
          {kicker}
        </p>

        {/* Het wordmark staat sinds v2 in de <h1>: visueel niets anders, maar nu
            weet een zoekmachine en een schermlezer wat de hoofdkop van de pagina
            is. `tabIndex={-1}` zodat de focus er na een paginawissel op kan
            landen zonder dat hij in de tabvolgorde komt.

            Het wordmark wordt nooit hertekend, herkleurd of uitgerekt. Dit is het
            aangeleverde bestand, op de breedtes uit de handoff: 720px op
            desktop, 520px op tablet, volle breedte op mobiel. Bewegen doet hij
            alleen als geheel (verschuiven en vervagen bij het scrollen), en hij
            begint altijd zichtbaar — hij is het LCP-element. */}
        <h1 className="m-0 leading-none" tabIndex={-1}>
          <Image
            src={wordmark.src}
            alt={copy.hero.wordmarkAlt}
            width={wordmark.width}
            height={wordmark.height}
            priority
            sizes="(min-width: 1025px) 720px, (min-width: 641px) 520px, 100vw"
            className="hero__wordmark h-auto w-full drop-shadow-[0_12px_40px_rgba(0,0,0,0.6)] sm:w-[520px] lg:w-[720px]"
          />
        </h1>

        {/* Twee varianten van dezelfde zin: het ontwerp schrijft op mobiel een
            kortere subkop voor. Beide staan in de HTML en CSS kiest — dat is een
            paar honderd bytes, en het alternatief is een layout shift of JS. */}
        <p
          className="hero__sub max-w-[560px] text-14 leading-[22px] sm:hidden"
          data-reveal="rise"
          data-reveal-manual
          data-hero-sub
        >
          {subShort}
        </p>
        <p
          className="hero__sub hidden max-w-[560px] text-18 leading-[28px] sm:block"
          data-reveal="rise"
          data-reveal-manual
          data-hero-sub
        >
          {sub}
        </p>

        <div className="hero__actions flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            href={localePath(locale, "/boeken")}
            variant="primary"
            className="flex min-h-12 w-full py-3.5 text-15 sm:inline-flex sm:w-auto sm:px-7 sm:py-4 sm:text-16"
            data-reveal=""
            data-reveal-manual=""
          >
            {copy.hero.ctaBook}
          </Button>
          {/* Op mobiel toont het ontwerp alleen de primaire knop. */}
          <Button
            href={localePath(locale, "/#shows")}
            variant="ghost"
            className="hidden min-h-12 px-7 py-4 text-16 sm:inline-flex"
            data-reveal=""
            data-reveal-manual=""
          >
            {copy.hero.ctaShows}
          </Button>
        </div>
      </div>

      {/* Ruissluier: korrel en scanlines die tijdens de intro van de hero
          aftrekken. In rust onzichtbaar. */}
      <div className="hero__veil" aria-hidden="true" />
    </section>
  );
}
