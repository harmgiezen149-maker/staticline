"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { locales, localePath, type Locale } from "@/lib/i18n";
import { decode } from "@/lib/motion/decode";
import { motionOn, ms, tok, wait } from "@/lib/motion/env";

/**
 * Het mobiele menupaneel, volgens design/v2/MOTION.md §6.7.
 *
 * In v1 was dit het enige stuk dat niet ontworpen was en dus geëxtrapoleerd. v2
 * ontwerpt het wel: een paneel over het hele scherm, onder de kop, zodat de knop
 * bereikbaar blijft. Grote links met een index in teal, onderaan de
 * boekingsknop, de taal en het mailadres.
 *
 * Openen: vier banden rollen uit, afwisselend van links en rechts, scanlines
 * flitsen één keer, de items komen op en de indexen decoderen. Sluiten: de items
 * vervagen, de banden rollen in omgekeerde volgorde terug. De hamburger klapt
 * eerst samen tot één lijn en wordt pas daarna een kruis.
 *
 * Het paneel staat altijd in de HTML, met `hidden` zolang het dicht is: dan kan
 * het openen geanimeerd worden in plaats van dat het in één beeld verschijnt.
 * Zonder JavaScript doet de knop niets en staan de links in de kop — zie
 * components/SiteHeader.tsx.
 */
type Props = {
  locale: Locale;
  /** Het pad zonder taal, zodat de taalwissel naar dezelfde pagina wijst. */
  path: string;
  links: { href: string; label: string }[];
  cta: { href: string; label: string };
  /** Tekst op de boekingsknop in het paneel; het ontwerp zegt daar "Boek ons". */
  ctaLabel: string;
  mail: string;
  labels: { nav: string; open: string; close: string };
};

type State = "closed" | "open" | "closing";

export function MobileNav({ locale, path, links, cta, ctaLabel, mail, labels }: Props) {
  const [state, setState] = useState<State>("closed");
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  // Wat er buiten het paneel ligt, is onbereikbaar zolang het open is: niet te
  // tabben, niet te scrollen, niet voor te lezen.
  const setBackground = (locked: boolean) => {
    for (const el of document.querySelectorAll("main, .site-footer")) {
      if (locked) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    }
    document.documentElement.style.overflow = locked ? "hidden" : "";
  };

  const open = useCallback(async () => {
    const panel = panelRef.current;
    if (!panel || busy.current) return;
    busy.current = true;

    panel.hidden = false;
    const items = [...panel.querySelectorAll<HTMLElement>("[data-menu-item]")];
    const rows = [...panel.querySelectorAll<HTMLElement>(".menu-panel__list li")];
    const step = ms("--stagger-item");
    items.forEach((el, i) => el.style.setProperty("--delay", `${160 + i * step}ms`));
    rows.forEach((el, i) => el.style.setProperty("--delay", `${200 + i * step}ms`));

    // Eén beeld wachten, zodat de begin-toestand er staat voordat hij verandert.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    setState("open");
    setBackground(true);

    if (motionOn()) {
      panel.querySelectorAll<HTMLElement>(".menu-panel__bands i").forEach((band, i) => {
        band.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
          duration: 420,
          delay: i * ms("--stagger-band"),
          easing: tok("--ease-band"),
          fill: "backwards",
        });
      });
      panel.querySelector<HTMLElement>(".menu-panel__scan")?.animate(
        [{ opacity: 0 }, { opacity: 0.12 }, { opacity: 0 }],
        { duration: 520, easing: "linear" },
      );
      panel.querySelectorAll<HTMLElement>(".menu-panel__index").forEach((el, i) => {
        setTimeout(() => decode(el, { duration: 360 }), 220 + i * 60);
      });
    } else {
      panel.querySelectorAll(".menu-panel__index").forEach((el) => el.classList.add("is-decoded"));
    }

    // Bedienbaar na 260 ms: dan staat de eerste link er en krijgt hij de focus.
    await wait(motionOn() ? 260 : 0);
    panel.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    busy.current = false;
  }, []);

  const close = useCallback(async (returnFocus = true) => {
    const panel = panelRef.current;
    if (!panel || busy.current) return;
    busy.current = true;
    setState("closing");

    await wait(ms("--dur-fast"));
    if (motionOn()) {
      const bands = [...panel.querySelectorAll<HTMLElement>(".menu-panel__bands i")].reverse();
      const animations = bands.map((band, i) =>
        band.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], {
          duration: 320,
          delay: i * 30,
          easing: tok("--ease-cut"),
          fill: "forwards",
        }),
      );
      await Promise.all(animations.map((a) => a.finished)).catch(() => {});
      animations.forEach((a) => a.cancel());
    }

    setState("closed");
    panel.hidden = true;
    setBackground(false);
    if (returnFocus) toggleRef.current?.focus({ preventScroll: true });
    busy.current = false;
  }, []);

  // Escape sluit; en het paneel gaat vanzelf dicht als het venster breder wordt
  // dan de mobiele stand, want daarboven bestaat het niet.
  useEffect(() => {
    if (state !== "open") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const wide = matchMedia("(min-width: 641px)");
    const onWide = () => wide.matches && close(false);
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [state, close]);

  // Een paginawissel met het paneel nog open (het mag niet, maar een terugknop
  // kan het): dan de achtergrond in elk geval weer vrijgeven.
  useEffect(() => () => setBackground(false), []);

  const expanded = state === "open";

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-label={expanded ? labels.close : labels.open}
        aria-expanded={expanded}
        aria-controls="menu-panel"
        onClick={() => (state === "open" ? close() : open())}
        // Boven het paneel (z-55): de knop moet bereikbaar blijven om het menu
        // weer te sluiten.
        className="nav-toggle relative z-60 h-11 w-11 shrink-0 cursor-pointer no-js:hidden sm:hidden"
      >
        <span />
      </button>

      <div
        ref={panelRef}
        id="menu-panel"
        className="menu-panel fixed inset-0 z-55 flex flex-col overflow-y-auto px-5 pt-22 pb-6 sm:hidden"
        data-state={state}
        hidden
      >
        <div className="menu-panel__bands" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="menu-panel__scan" aria-hidden="true" />

        <nav aria-label={labels.nav}>
          <ol className="menu-panel__list m-0 list-none p-0">
            {links.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-menu-item
                  onClick={() => close(false)}
                  className="flex min-h-16 items-baseline gap-4 py-3 font-display text-44 leading-none font-bold tracking-tight2 text-primary uppercase hover:text-accent-hover focus-visible:text-accent-hover"
                >
                  <span
                    className="menu-panel__index min-w-[2.5ch] font-mono text-12 font-normal tracking-wide18 text-accent-alt"
                    data-decode
                    data-decode-manual
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-auto flex flex-col gap-4 pt-8">
          <Link
            href={cta.href}
            data-menu-item
            onClick={() => close(false)}
            className="btn btn--primary flex min-h-12 w-full items-center justify-center py-4 font-display text-16 font-bold tracking-wide12 uppercase"
          >
            <span className="btn__label">{ctaLabel}</span>
          </Link>

          <p className="m-0 flex gap-1" data-menu-item>
            {locales.map((option) =>
              option === locale ? (
                <span
                  key={option}
                  aria-current="true"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center font-mono text-14 tracking-wide14 text-primary uppercase"
                >
                  {option}
                </span>
              ) : (
                <Link
                  key={option}
                  href={localePath(option, path)}
                  hrefLang={option}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center font-mono text-14 tracking-wide14 text-faint uppercase"
                >
                  {option}
                </Link>
              ),
            )}
          </p>

          <a
            href={`mailto:${mail}`}
            data-menu-item
            className="py-3 font-mono text-12 tracking-wide14 text-accent-alt uppercase"
          >
            {mail}
          </a>
        </div>
      </div>
    </>
  );
}
