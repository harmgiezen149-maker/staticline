"use client";

import { useState } from "react";

/**
 * Wat de browser zelf zegt over installeren.
 *
 * Dit scherm heeft één beheerder, en die zit niet in de ontwikkelaarsconsole.
 * Toen installeren niet lukte, was de enige manier om te achterhalen waarom het
 * heen en weer vragen wat er op het scherm stond — twee keer, en nog was het
 * niet duidelijk. Dit leest de vier dingen uit die het antwoord bepalen, zodat
 * één blik genoeg is.
 *
 * Bewust niet altijd zichtbaar: het is gereedschap, geen inhoud. Het staat
 * achter een regel die je aanklikt als het niet lukt.
 */

type Regel = { label: string; waarde: string; goed: boolean };

async function lees(): Promise<Regel[]> {
  const ua = navigator.userAgent;
  const chromium = /Chrome\/|Chromium\/|Edg\//.test(ua);
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;

  // De service worker. Zonder actieve worker biedt Chrome de installatie niet
  // aan; daarom staat zijn scope erbij en niet alleen "ja".
  let sw = "niet ondersteund";
  let swGoed = false;
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/beheer");
      if (reg?.active) {
        sw = `actief op ${new URL(reg.scope).pathname}`;
        swGoed = true;
      } else if (reg) {
        sw = "geregistreerd, nog niet actief";
      } else {
        sw = "niet geregistreerd";
      }
    } catch (error) {
      sw = `fout: ${error instanceof Error ? error.message : "onbekend"}`;
    }
  }

  // Het manifest, opgehaald zoals de browser het ophaalt.
  let manifest = "niet opgehaald";
  let manifestGoed = false;
  try {
    const res = await fetch("/beheer/manifest.webmanifest", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.name) {
      manifest = `${res.status}, naam "${data.name}"`;
      manifestGoed = true;
    } else {
      manifest = `${res.status}, geen bruikbare inhoud`;
    }
  } catch (error) {
    manifest = `fout: ${error instanceof Error ? error.message : "onbekend"}`;
  }

  return [
    {
      label: "Browser",
      waarde: ios ? "iOS (Safari-motor)" : chromium ? "Chrome, Edge of verwant" : "andere browser",
      goed: chromium || ios,
    },
    { label: "Draait als app", waarde: standalone ? "ja" : "nee", goed: true },
    { label: "Service worker", waarde: sw, goed: swGoed },
    { label: "Manifest", waarde: manifest, goed: manifestGoed },
    {
      label: "Installatie aangeboden",
      waarde: window.installPrompt ? "ja" : "nee",
      // Op iOS gebeurt dit nooit, en dat is daar geen fout.
      goed: Boolean(window.installPrompt) || ios,
    },
  ];
}

export function InstallDiagnose() {
  const [regels, setRegels] = useState<Regel[] | null>(null);
  const [bezig, setBezig] = useState(false);

  if (!regels) {
    return (
      <button
        type="button"
        disabled={bezig}
        onClick={async () => {
          setBezig(true);
          setRegels(await lees());
          setBezig(false);
        }}
        className="self-start font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary disabled:opacity-60"
      >
        {bezig ? "Bezig…" : "Lukt installeren niet?"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 border border-line px-4 py-3">
      <p className="font-mono text-11 text-faint uppercase">Wat je browser zegt</p>
      <dl className="flex flex-col">
        {regels.map((regel) => (
          <div key={regel.label} className="flex flex-wrap gap-x-3 border-b border-line py-1 last:border-0">
            <dt className="w-40 shrink-0 font-mono text-11 text-muted uppercase">
              {regel.label}
            </dt>
            <dd className={`font-mono text-12 ${regel.goed ? "" : "text-warning"}`}>
              {regel.waarde}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-muted">
        Staat hier alles goed en lukt installeren toch niet, dan houdt je
        browser het tegen en niet deze site. In Chrome kan het dan nog via{" "}
        <strong>Casten, opslaan en delen → Pagina installeren als app</strong>,
        in Edge via <strong>Apps → Deze site als app installeren</strong>.
      </p>
    </div>
  );
}
