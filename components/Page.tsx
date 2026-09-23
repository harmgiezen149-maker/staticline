import type { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import type { Locale } from "@/lib/i18n";

/**
 * Het omhulsel van elke pagina behalve de homepage.
 *
 * GEËXTRAPOLEERD, niet ontworpen. De handoff tekent alleen de homepage. Dit volgt
 * de patronen die daar al staan: dezelfde kop en voet, dezelfde sectiepadding, en
 * een paginakop in dezelfde vorm als "Alle shows" — Oswald, uppercase, met de
 * dikke onderrand eronder.
 *
 * De beweging komt uit v2: wat de handoff "gewone scroll-entrees" noemt voor
 * de andere pagina's. De kop schuift van onder een masker, de lijn tekent, en
 * elke sectie komt op zodra hij in beeld komt. Er zijn geen nieuwe kleuren,
 * radii of schaduwen bijgekomen.
 */
type Props = {
  locale: Locale;
  /** Pad zonder taalvoorvoegsel, voor de taalwissel in de kop. */
  path: string;
  title: string;
  intro?: string;
  children: ReactNode;
};

export function Page({ locale, path, title, intro, children }: Props) {
  return (
    <>
      <SiteHeader locale={locale} path={path} />
      <main
        id="main"
        tabIndex={-1}
        className="site-main px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16"
      >
        {/* De paginakop in dezelfde vorm als "Alle shows": van onder een
            regelmasker omhoog, met een lijn die zichzelf tekent. `tabIndex`
            zodat de focus er na een paginawissel op kan landen. */}
        <header
          className="kop-lijn flex flex-col gap-3 border-b-2 border-primary pb-2 sm:pb-3"
          data-reveal="mask"
        >
          <h1
            className="font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase sm:text-[clamp(28px,4vw,44px)]"
            tabIndex={-1}
          >
            <span className="mask-line">
              <span>{title}</span>
            </span>
          </h1>
        </header>
        {intro && (
          <p
            className="mt-6 max-w-[560px] text-14 leading-[22px] text-muted sm:text-16 sm:leading-[26px]"
            data-reveal="rise"
          >
            {intro}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-12 sm:mt-12 sm:gap-16">
          {children}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

/**
 * Een sectie binnen een pagina, met een kop in de tweede orde.
 *
 * Dunnere onderrand dan de paginakop, zodat de hiërarchie klopt zonder dat er een
 * nieuwe maat bij komt.
 */
export function Section({
  title,
  note,
  children,
  id,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 sm:gap-6" data-reveal="rise">
      <div className="kop-lijn flex flex-col gap-1 border-b border-line pb-2 [--kop-lijn-dikte:1px] [--kop-lijn-kleur:var(--border-default)]">
        <h2 className="font-display text-22 leading-[1.2] font-semibold tracking-tight4 uppercase sm:text-30">
          {title}
        </h2>
        {note && (
          <p className="font-mono text-11 tracking-wide10 text-faint">{note}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Wat er staat waar nog geen inhoud is.
 *
 * Bewust een eigen component: lege staten zijn niet ontworpen, en door ze op één
 * plek te houden zien ze er overal hetzelfde uit. Geen icoon, geen kader — alleen
 * een zin die zegt wat er komt.
 */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-[560px] text-14 leading-[22px] text-muted sm:text-16 sm:leading-[26px]">
      {children}
    </p>
  );
}
