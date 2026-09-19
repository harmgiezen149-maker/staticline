"use client";

import { useActionState, useState } from "react";

import { type TovState, type Uitvoer, herschrijf } from "@/app/(beheer)/beheer/tov/actions";
import type { TextType } from "@/lib/tov/config";

/**
 * Het herschrijfscherm.
 *
 * Eén invoerveld, twee uitvoervelden. De tekst mag Nederlands of Engels zijn;
 * beide talen worden rechtstreeks uit de brontekst geschreven en niet uit
 * elkaar vertaald.
 *
 * De uitvoer is een voorstel. Daarom staat onder elk vak wat er is aangepast:
 * je leest terug wat er met je tekst gebeurd is in plaats van het te moeten
 * raden, en dat is precies waar je op controleert voor je hem gebruikt.
 */
export function TovForm({
  types,
  maxChars,
}: {
  types: TextType[];
  maxChars: number;
}) {
  const [state, action, pending] = useActionState<TovState, FormData>(
    herschrijf,
    null,
  );
  const [lengte, setLengte] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Teksttype</span>
          <select
            name="textType"
            defaultValue={types[0]?.id}
            className="border border-line-default bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          >
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label} — max {type.maxWords} woorden
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between gap-4">
            <span className="font-mono text-11 text-faint uppercase">
              Je tekst <span className="normal-case">— Nederlands of Engels</span>
            </span>
            <span
              className={`font-mono text-11 ${lengte > maxChars ? "text-danger" : "text-faint"}`}
            >
              {lengte} / {maxChars}
            </span>
          </span>
          <textarea
            name="text"
            rows={8}
            onChange={(event) => setLengte(event.target.value.length)}
            placeholder="Plak hier de tekst die je wilt herschrijven."
            className="border border-line-default bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">
            Achtergrond <span className="normal-case">— mag leeg</span>
          </span>
          <input
            type="text"
            name="context"
            placeholder="Bijvoorbeeld: voor Instagram, of voor festival X"
            className="border border-line-default bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
          <span className="text-muted">
            Dit is achtergrond voor de toon, geen bron voor nieuwe feiten. Wat
            hier staat, komt niet als feit in de tekst.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Bezig…" : "Herschrijven"}
          </button>
          {pending && (
            <span className="text-muted">
              Dit duurt even: hij schrijft, rekent het na en verbetert zo nodig
              nog een keer.
            </span>
          )}
          {state && !state.ok && (
            <span className="text-danger">{state.message}</span>
          )}
        </div>
      </form>

      {state?.ok && (
        <div className="flex flex-col gap-6">
          {state.flags.length > 0 && (
            <section className="flex flex-col gap-2 border border-line-strong p-4">
              <h2 className="font-mono text-11 text-faint uppercase">Let op</h2>
              <ul className="flex flex-col gap-1">
                {state.flags.map((flag, index) => (
                  <li key={index} className="text-danger">
                    {flag.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Vak titel="Nederlands" uitvoer={state.nl} />
            <Vak titel="Engels" uitvoer={state.en} />
          </div>
        </div>
      )}
    </div>
  );
}

function Vak({ titel, uitvoer }: { titel: string; uitvoer: Uitvoer }) {
  const [gekopieerd, setGekopieerd] = useState(false);

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(uitvoer.text);
      setGekopieerd(true);
      window.setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      // Zonder toestemming op het klembord valt er niets te melden dat helpt;
      // de tekst staat gewoon te selecteren.
    }
  }

  return (
    <section className="flex flex-col gap-3 border border-line-default p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-18 font-bold tracking-tight2 uppercase">
          {titel}
        </h2>
        <span className="flex items-baseline gap-4">
          <span className="font-mono text-11 text-faint uppercase">
            {uitvoer.wordCount} woorden
          </span>
          <button
            type="button"
            onClick={kopieer}
            className="font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
          >
            {gekopieerd ? "Gekopieerd" : "Kopieer"}
          </button>
        </span>
      </div>

      {/* Invoer van een mens; React ontsnapt de inhoud zelf. `pre-wrap` houdt
          de regelovergangen die het model gezet heeft. */}
      <p className="whitespace-pre-wrap">{uitvoer.text}</p>

      {uitvoer.changes.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-line-default pt-3">
          <span className="font-mono text-11 text-faint uppercase">Aangepast</span>
          <ul className="flex flex-col gap-1">
            {uitvoer.changes.map((change, index) => (
              <li key={index} className="text-muted">
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
