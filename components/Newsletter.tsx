"use client";

import { useState } from "react";

import type { Copy } from "@/content";
import type { Locale } from "@/lib/i18n";

/**
 * De nieuwsbriefstrip.
 *
 * GEËXTRAPOLEERD, niet ontworpen. Volgt de vorm van de volgende-show-balk: een
 * volvlakke strook over de volle breedte, maar in `bg-surface` in plaats van
 * accent — want de accentkleur hoort bij de show, en twee rode balken op één
 * pagina laat geen van beide nog iets betekenen.
 *
 * Aanmelden gebeurt met dubbele opt-in: dit formulier legt alleen vast dat iemand
 * zich wil aanmelden, en de bevestiging gaat per mail. Zonder die stap kan iemand
 * anders jouw adres invullen.
 *
 * Het vinkje voor ander nieuws staat standaard uit. De strook belooft "een mail
 * als er een show bij komt"; wie meer wil, zegt dat zelf.
 */
export function Newsletter({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Copy["newsletter"];
}) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [email, setEmail] = useState("");
  const [news, setNews] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/nieuwsbrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          news,
          // Het verborgen veld hoort leeg te blijven; een bot vult alles in.
          website: form.get("website") ?? "",
        }),
      });
      setState(res.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section
      aria-label={copy.title}
      className="flex flex-col gap-4 bg-surface px-5 py-8 sm:px-8 sm:py-10 lg:px-12"
      data-reveal="rise"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-22 font-semibold tracking-tight4 uppercase sm:text-30">
          {copy.title}
        </h2>
        <p className="max-w-[560px] text-14 leading-[22px] text-muted">
          {copy.body}
        </p>
      </div>

      {state === "ok" ? (
        <p className="max-w-[560px] text-14 leading-[22px] text-accent-alt">
          {copy.ok}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex max-w-[560px] flex-col gap-3">
          {/* Op mobiel staan veld, vinkje en knop onder elkaar, het vinkje vóór
              de knop: `contents` laat het veld en de knop dan meedoen in de
              kolom van het formulier, en `order` zet ze op hun plek. Vanaf
              tablet staan veld en knop naast elkaar en het vinkje eronder. */}
          <div className="contents sm:flex sm:flex-row sm:gap-3">
            <label className="sr-only" htmlFor="newsletter-email">
              {copy.placeholder}
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.placeholder}
              className="order-1 min-h-11 flex-1 border border-line-strong sm:order-none bg-inset px-3 py-3 text-16 text-primary placeholder:text-faint"
            />
            {/* Honeypot: onzichtbaar voor mensen, onweerstaanbaar voor bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="order-3 min-h-11 bg-accent px-6 py-3 sm:order-none font-display text-15 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60"
            >
              {copy.submit}
            </button>
          </div>
          <label className="order-2 flex min-h-11 cursor-pointer items-center gap-3 self-start text-14 text-muted sm:order-none sm:min-h-0">
            {/* Een eigen vakje in plaats van dat van de browser: dat heeft
                afgeronde hoeken, en de radius is overal 0. Aangevinkt vult het
                zich met de accentkleur, met het vinkje erover in de kleur van
                de pagina. */}
            <span className="relative flex h-5 w-5 shrink-0">
              <input
                type="checkbox"
                checked={news}
                onChange={(event) => setNews(event.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none border border-line-strong bg-inset transition-colors duration-[160ms] checked:border-accent checked:bg-accent"
              />
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden h-5 w-5 peer-checked:block"
              >
                <path
                  d="M3.5 8.5l3 3 6-6.5"
                  fill="none"
                  stroke="var(--bg-inset)"
                  strokeWidth="2.25"
                  strokeLinecap="square"
                />
              </svg>
            </span>
            {copy.news}
          </label>
        </form>
      )}

      {state === "error" && <p className="text-14 text-danger">{copy.error}</p>}

      <p className="font-mono text-11 tracking-wide10 text-faint">
        {copy.consent}
      </p>
    </section>
  );
}
