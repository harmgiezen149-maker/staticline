"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { enter, leave, progressDone, progressStart } from "@/lib/motion/transition";

/**
 * De lichte basis van v2 voor het besloten deel.
 *
 * Geen loader, geen ruis, geen entrees, geen cursorlabel: wie in /beheer werkt,
 * wil een formulier en geen voorstelling. Wel twee dingen uit
 * design/v2/MOTION.md §6.2:
 *
 * - **De rustige overgang** tussen schermen: de banden alleen in dekking, 200 ms
 *   dicht en 240 ms open, zonder schuiven.
 * - **De voortgangslijn** voor wat even duurt: een navigatie, of een formulier
 *   dat naar de server gaat (inloggen, opslaan). De lijn loopt naar 85% en
 *   wacht daar tot er iets terugkomt.
 *
 * Aan de inlog, de routering en de koppeling met de Band App verandert niets.
 * Dit luistert alleen mee.
 */
export function CalmLayer() {
  const pathname = usePathname();
  const router = useRouter();
  const first = useRef(true);
  const navigating = useRef(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor?.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href);
      // Alleen binnen het besloten deel. Een link naar de publieke site is een
      // andere root layout en dus toch een volledige lading.
      if (url.origin !== location.origin) return;
      if (url.pathname !== "/beheer" && !url.pathname.startsWith("/beheer/")) return;
      if (url.pathname === location.pathname) return;
      // Het manifest en de service worker zijn bestanden, geen schermen.
      if (/\.[a-z0-9]{2,12}$/i.test(url.pathname)) return;

      event.preventDefault();
      if (navigating.current) return;
      navigating.current = true;
      progressStart();
      leave({ variant: "calm" }).then(() => {
        router.push(url.pathname + url.search + url.hash);
        setTimeout(() => {
          if (!navigating.current) return;
          navigating.current = false;
          progressDone();
          enter({ variant: "calm" });
        }, 8000);
      });
    };

    // Een formulier dat verstuurd wordt: de lijn loopt tot er iets verandert
    // op het scherm (een melding, een nieuwe lijst) of tot de volgende pagina.
    let watcher: MutationObserver | null = null;
    let cap = 0;
    const onSubmit = () => {
      progressStart();
      watcher?.disconnect();
      clearTimeout(cap);
      const main = document.querySelector("main") ?? document.body;
      watcher = new MutationObserver(() => {
        watcher?.disconnect();
        watcher = null;
        progressDone();
      });
      watcher.observe(main, { childList: true, subtree: true, characterData: true });
      cap = window.setTimeout(() => {
        watcher?.disconnect();
        watcher = null;
        progressDone();
      }, 10000);
    };

    window.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      watcher?.disconnect();
      clearTimeout(cap);
    };
  }, [router]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const viaTransition = navigating.current;
    navigating.current = false;
    progressDone();

    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading && viaTransition) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    enter({ variant: "calm" });
  }, [pathname]);

  return null;
}
