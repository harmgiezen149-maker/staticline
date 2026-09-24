"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import type { Copy } from "@/content/types";

import { motionOn, root } from "@/lib/motion/env";
import { initLightbox } from "@/lib/motion/lightbox";
import { runLoader } from "@/lib/motion/loader";
import { initCursorLabel, initHoverScramble } from "@/lib/motion/pointer";
import {
  arriveAtHash,
  enableReveals,
  forgetWaiting,
  observeReveals,
} from "@/lib/motion/reveal";
import { channelLabel, classifyLink, stripLocale } from "@/lib/motion/routes";
import { heroIntro, initScroll, updateScroll } from "@/lib/motion/scroll";
import { initStoring } from "@/lib/motion/storing";
import {
  enter,
  langSwap,
  leave,
  rememberLangSwap,
  takeLangSwap,
} from "@/lib/motion/transition";

/**
 * De motion-laag van de publieke site.
 *
 * Eén clientcomponent in de root layout, en verder niets. De secties zelf
 * blijven servercomponenten: ze zeggen in hun markup wat er moet gebeuren
 * (`data-reveal`, `data-decode`, `data-cursor`) en dit loopt daar na elke
 * paginawissel overheen. Zonder JavaScript gebeurt er niets en staat alles er
 * gewoon — dat is de toestand die design/v2/reference/index.html tekent.
 *
 * Het rendert zelf niets. De lagen die het bedient (loader, overgang,
 * cursorlabel, lightbox) staan als gewone markup in de layout, zodat React ze
 * kent en er bij een volgende render niet over struikelt.
 */
type Props = {
  /** De navigatieteksten, voor het kanaallabel tijdens een overgang. */
  nav: Copy["nav"];
};

export function MotionLayer({ nav }: Props) {
  const pathname = usePathname();
  // Per pad zonder taal de naam die tijdens de overgang in beeld komt.
  const channels = useMemo<Record<string, string>>(
    () => ({
      "/": nav.home,
      "/agenda": nav.shows,
      "/fotos": nav.photos,
      "/band": nav.band,
      "/muziek": nav.music,
      "/video": nav.video,
      "/boeken": nav.booking,
    }),
    [nav],
  );
  const router = useRouter();
  const first = useRef(true);
  const navigating = useRef(false);

  // Eenmalig: alles wat de hele sessie blijft staan.
  useEffect(() => {
    root().classList.add("motion-ready");

    // Wie halverwege minder beweging aanzet, krijgt een pagina die daar vanaf
    // het begin op ingesteld is. Alles halverwege omzetten is foutgevoelig.
    const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const reload = () => location.reload();
    reduceQuery.addEventListener("change", reload);

    initScroll();
    initCursorLabel();
    initHoverScramble();
    initLightbox();
    arriveAtHash();
    observeReveals(document);
    initStoring(document);

    const swap = takeLangSwap(location.pathname);
    if (swap) {
      // Aankomst na een taalwissel: dezelfde plek, labels die decoderen, geen
      // loader en geen intro. De focus blijft op de taalschakelaar.
      root().classList.remove("sl-intro");
      window.scrollTo(0, swap.y);
      heroIntro("short");
      enableReveals();
      langSwap();
      document.querySelector<HTMLElement>("[data-lang-switch] a, [data-lang-switch] [aria-current]")?.focus({ preventScroll: true });
    } else {
      const opened = runLoader();
      if (opened) {
        opened.then(({ skipped }) => {
          heroIntro(skipped ? "short" : "full");
          setTimeout(enableReveals, skipped ? 0 : 280);
        });
      } else {
        heroIntro("short");
        enableReveals();
      }
    }

    return () => reduceQuery.removeEventListener("change", reload);
  }, []);

  // Kliks op interne links onderscheppen voor de kanaalwissel.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || !anchor.href) return;

      const kind = classifyLink({
        href: anchor.href,
        current: location.href,
        target: anchor.getAttribute("target"),
        download: anchor.hasAttribute("download"),
        modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
      });

      if (kind === "lang") {
        // Geen preventDefault: dit wordt een volledige lading, en die mag
        // gewoon gebeuren. Alleen onthouden waar je was.
        rememberLangSwap(new URL(anchor.href).pathname);
        return;
      }
      // Ook met minder beweging: dan wordt het een crossfade van 120 ms via
      // dezelfde banden (zie leave()), zonder dat er iets schuift.
      if (kind !== "band") return;

      // Next's <Link> ziet een klik die al is tegengehouden en doet dan zelf
      // niets. Wij navigeren pas als het doek dicht is.
      event.preventDefault();
      if (navigating.current) return;
      navigating.current = true;

      const url = new URL(anchor.href);
      const name = channels[stripLocale(url.pathname)] ?? "";
      leave({ label: name ? channelLabel(url.pathname, name) : "" }).then(() => {
        router.push(url.pathname + url.search + url.hash);
        // Vangnet: komt de nieuwe pagina er niet (een fout, een afgebroken
        // lading), dan gaat het doek toch weer open. Een dichte site is erger
        // dan een overgang zonder einde.
        setTimeout(() => {
          if (!navigating.current) return;
          navigating.current = false;
          enter();
        }, 8000);
      });
    };

    // In de capture-fase op window: vóór React, dat op document luistert.
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [channels, router]);

  // Na elke paginawissel: de nieuwe inhoud klaarzetten en het doek openen.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    forgetWaiting();
    arriveAtHash();
    observeReveals(document);
    enableReveals();
    updateScroll();
    initStoring(document);

    const viaTransition = navigating.current;
    navigating.current = false;

    heroIntro("short");

    // Focus naar de kop van de nieuwe pagina, zodat een schermlezer en een
    // toetsenbordgebruiker weten dat er iets veranderd is. Zonder te scrollen:
    // de pagina staat al bovenaan, of op de bewaarde plek bij terug/vooruit.
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading && viaTransition) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }

    // Terug of vooruit in de browser: die navigatie is al gebeurd, dus het
    // doek gaat direct dicht en daarna open.
    enter({ fromCovered: !viaTransition && motionOn() });
  }, [pathname]);

  return null;
}
