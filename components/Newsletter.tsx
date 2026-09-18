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
 */
export function Newsletter({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Copy["newsletter"];
}) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [email, setEmail] = useState("");

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
        <form
          onSubmit={onSubmit}
          className="flex max-w-[560px] flex-col gap-3 sm:flex-row"
        >
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
            className="min-h-11 flex-1 border border-line-strong bg-inset px-3 py-3 text-16 text-primary placeholder:text-faint"
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
            className="min-h-11 bg-accent px-6 py-3 font-display text-15 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover disabled:opacity-60"
          >
            {copy.submit}
          </button>
        </form>
      )}

      {state === "error" && (
        <p className="text-14 text-danger">{copy.error}</p>
      )}

      <p className="font-mono text-11 tracking-wide10 text-faint">
        {copy.consent}
      </p>
    </section>
  );
}
