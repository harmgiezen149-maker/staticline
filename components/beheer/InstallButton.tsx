"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * Het event dat Chrome vuurt als het de app installeerbaar vindt.
 *
 * Staat niet in de typedefinities van de browser: het is geen standaard, alleen
 * Chromium kent het. Vandaar deze verklaring, met precies het ene ding dat hier
 * gebruikt wordt. De layout vangt het op en zet het op `window`.
 */
declare global {
  interface Window {
    installPrompt: { prompt: () => Promise<void> } | null;
  }
}

const STANDALONE = "(display-mode: standalone)";

/**
 * Waar we op draaien, als één woord.
 *
 * Eén tekenreeks en geen object, omdat React deze waarde bij elke render
 * vergelijkt: een nieuw object bij elke aanroep zou een oneindige lus geven.
 */
type Omgeving = "geinstalleerd" | "ios" | "anders";

function leesOmgeving(): Omgeving {
  if (window.matchMedia(STANDALONE).matches) return "geinstalleerd";

  // iPhone en iPad. `maxTouchPoints` erbij omdat een iPad zich sinds iPadOS als
  // een Mac voordoet in de user agent.
  const ua = navigator.userAgent;
  const apple = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return apple ? "ios" : "anders";
}

function volgOmgeving(melden: () => void) {
  const query = window.matchMedia(STANDALONE);
  query.addEventListener("change", melden);
  // Zodra de installatie klaar is, verdwijnt de knop zonder herladen.
  window.addEventListener("appinstalled", melden);
  return () => {
    query.removeEventListener("change", melden);
    window.removeEventListener("appinstalled", melden);
  };
}

function volgPrompt(melden: () => void) {
  window.addEventListener("installpromptchange", melden);
  return () => window.removeEventListener("installpromptchange", melden);
}

/**
 * De knop om het beheer op het beginscherm te zetten.
 *
 * Drie toestanden, en die verschillen per toestel:
 *
 * - **Android en desktop-Chrome** geven een `beforeinstallprompt`-event zodra ze
 *   de app installeerbaar vinden. Dat event wordt in de layout opgevangen,
 *   vóórdat React geladen is — anders is het weg voordat deze component bestaat.
 *   Zie app/(beheer)/layout.tsx.
 * - **iOS** kent dat event niet en zal het ook nooit krijgen. Daar gaat het via
 *   het deelmenu van Safari, en het enige wat hier kan is uitleggen hoe.
 * - **Al geïnstalleerd**: dan staat er niets. De app staat al waar hij hoort.
 *
 * `useSyncExternalStore` en geen `useEffect` met `useState`: dit zijn drie
 * dingen die de browser al weet en die wij alleen uitlezen. Tijdens het renderen
 * op de server is er geen browser, dus daar is het antwoord "anders" en is er
 * niets te zien; zodra de pagina in de browser staat, komt het echte antwoord
 * erbij. Dat is precies waar deze haak voor is.
 */
export function InstallButton() {
  const omgeving = useSyncExternalStore<Omgeving>(volgOmgeving, leesOmgeving, () => "anders");
  const prompt = useSyncExternalStore(volgPrompt, () => window.installPrompt, () => null);
  const [uitleg, setUitleg] = useState(false);

  if (omgeving === "geinstalleerd") return null;

  const knop =
    "self-start border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary";

  if (prompt) {
    return (
      <button
        type="button"
        className={knop}
        onClick={async () => {
          await prompt.prompt();
          // Eenmalig bruikbaar: na `prompt()` is dit event op.
          window.installPrompt = null;
          window.dispatchEvent(new Event("installpromptchange"));
        }}
      >
        Op beginscherm zetten
      </button>
    );
  }

  // Geen prompt en geen iOS: de browser vindt de app (nog) niet installeerbaar,
  // of het is er een die het niet kan. Dan is een knop die niets doet erger dan
  // geen knop.
  if (omgeving !== "ios") return null;

  return (
    <div className="flex flex-col gap-3">
      <button type="button" className={knop} onClick={() => setUitleg((v) => !v)}>
        Op beginscherm zetten
      </button>
      {uitleg && (
        <p className="text-muted">
          Op een iPhone doet Safari dit zelf niet. Tik onderin op het deelteken
          (het vierkantje met de pijl omhoog), kies{" "}
          <strong>Zet op beginscherm</strong> en bevestig. Daarna staat het
          beheer als app op je telefoon, zonder adresbalk.
        </p>
      )}
    </div>
  );
}
