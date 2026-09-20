"use client";

import { useState, useSyncExternalStore } from "react";

import { InstallDiagnose } from "./InstallDiagnose";

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
type Omgeving = "geinstalleerd" | "ios" | "chromium" | "anders";

function leesOmgeving(): Omgeving {
  if (window.matchMedia(STANDALONE).matches) return "geinstalleerd";

  const ua = navigator.userAgent;

  // iPhone en iPad. `maxTouchPoints` erbij omdat een iPad zich sinds iPadOS als
  // een Mac voordoet in de user agent. Dit moet vóór de Chromium-controle: een
  // Chrome op een iPhone is onderhuids gewoon Safari en kan net zomin zelf
  // installeren.
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return "ios";
  }

  // Chrome, Edge, Brave, Opera. Die kunnen installeren, ook als ze het op dit
  // moment niet uit zichzelf aanbieden.
  if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return "chromium";

  return "anders";
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

const KNOP =
  "self-start border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary";

/**
 * De knop om het beheer als app te installeren.
 *
 * Vier toestanden, en dat is er drie meer dan je zou hopen — maar browsers
 * verschillen hier nu eenmaal, en de eerste versie van dit component liet in
 * twee van de vier gevallen niets zien. Dat leest als een kapotte knop terwijl
 * er niets kapot is.
 *
 * - **Chrome of Edge dat het aanbiedt.** Dan is er een `beforeinstallprompt`
 *   binnengekomen. Dat event wordt in de layout opgevangen, vóórdat React
 *   geladen is — anders is het weg voordat dit component bestaat. Eén tik en
 *   het staat er.
 * - **Chrome of Edge dat het níét aanbiedt.** Dat gebeurt: het event komt maar
 *   één keer, en wie het ooit weggeklikt heeft krijgt het voorlopig niet terug.
 *   De installatie zelf kan nog gewoon, alleen via het menu van de browser.
 *   Vandaar uitleg in plaats van niets.
 * - **iOS.** Kent dat event niet en zal het ook nooit krijgen. Daar gaat het via
 *   het deelmenu van Safari.
 * - **Al geïnstalleerd.** Dan staat er niets. De app staat al waar hij hoort.
 *
 * `useSyncExternalStore` en geen `useEffect` met `useState`: dit zijn dingen die
 * de browser al weet en die wij alleen uitlezen. Tijdens het renderen op de
 * server is er geen browser, dus daar is er niets te zien; zodra de pagina in de
 * browser staat, komt het echte antwoord erbij.
 */
export function InstallButton() {
  const omgeving = useSyncExternalStore<Omgeving>(volgOmgeving, leesOmgeving, () => "anders");
  const prompt = useSyncExternalStore(volgPrompt, () => window.installPrompt, () => null);
  const [uitleg, setUitleg] = useState(false);

  if (omgeving === "geinstalleerd") return null;

  return (
    <div className="flex flex-col gap-3">
      {prompt ? (
        <button
          type="button"
          className={KNOP}
          onClick={async () => {
            await prompt.prompt();
            // Eenmalig bruikbaar: na `prompt()` is dit event op, ook als je het
            // venster wegklikt. Daarna valt dit component terug op de uitleg
            // hieronder, want via het menu kan het nog wel.
            window.installPrompt = null;
            window.dispatchEvent(new Event("installpromptchange"));
          }}
        >
          Nu installeren
        </button>
      ) : omgeving === "anders" ? (
        <p className="text-muted">
          Deze browser kan geen apps installeren. Open het beheer in Chrome of
          Edge, dan kan het wel.
        </p>
      ) : (
        <>
          {/* Een knop die uitleg opent en niet installeert. Dat staat er met
              zoveel woorden bij: een knop die "installeren" heet en alleen tekst
              toont, leest als een knop die stuk is. */}
          <button type="button" className={KNOP} onClick={() => setUitleg((v) => !v)}>
            Lees hoe je dit installeert
          </button>
          {uitleg &&
            (omgeving === "ios" ? (
              <p className="text-muted">
                Op een iPhone of iPad doet Safari dit niet uit zichzelf. Tik
                onderin op het deelteken (het vierkantje met de pijl omhoog),
                kies <strong>Zet op beginscherm</strong> en bevestig.
              </p>
            ) : (
              <p className="text-muted">
                Kijk rechts in de adresbalk: daar staat een icoontje van een
                scherm met een pijl omlaag. Zie je dat niet, dan zit het in het
                menu van de browser: in Chrome onder{" "}
                <strong>
                  Casten, opslaan en delen → Pagina installeren als app
                </strong>
                , in Edge onder{" "}
                <strong>Apps → Deze site als app installeren</strong>.
              </p>
            ))}
        </>
      )}

      {/* Altijd bereikbaar, ook als er wél een knop staat: als die klik niets
          oplevert, is dit de enige manier om te zien waaróm. */}
      <InstallDiagnose />
    </div>
  );
}
