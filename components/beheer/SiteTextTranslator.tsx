"use client";

import { useActionState } from "react";

import {
  type SaveState,
  translateSiteTexts,
} from "@/app/(beheer)/beheer/inhoud/actions";

/**
 * De Engelse versie van de siteteksten laten maken.
 *
 * Een eigen formulier naast dat van de teksten, niet erin: een formulier in een
 * formulier bestaat niet in HTML, en de browser doet er dan iets eigens mee.
 *
 * Werkt op wat er opgeslagen staat. Vandaar de regel eronder — anders druk je
 * hierop met een half getypte zin in beeld en vertaalt hij de vorige.
 */
export function SiteTextTranslator({ todo }: { todo: number }) {
  const [state, action, pending] = useActionState<SaveState>(
    async () => translateSiteTexts(),
    null,
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-11 text-faint uppercase">Engels bijwerken</h2>
      <p className="text-muted">
        Vult de Engelse velden hierboven met een vertaling van het Nederlands.
        Wat je zelf hebt ingevuld blijft staan; alleen lege en verouderde teksten
        worden gemaakt. Sla eerst je wijzigingen op — dit werkt op wat er
        opgeslagen staat.
      </p>

      <form action={action} className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || todo === 0}
          className="inline-flex items-center justify-center border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary disabled:opacity-60"
        >
          {pending
            ? "Bezig met vertalen…"
            : todo === 0
              ? "Alles is ingevuld"
              : `Vertaal ${todo} ${todo === 1 ? "tekst" : "teksten"}`}
        </button>
        {state && (
          <span className={state.ok ? "text-muted" : "text-danger"}>
            {state.message}
          </span>
        )}
      </form>
    </section>
  );
}
