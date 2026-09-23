"use client";

import { useActionState } from "react";

import { type ActionState, runSchema } from "@/app/(beheer)/beheer/database/actions";

/**
 * De knop die db/schema.sql draait, met de uitkomst per opdracht eronder.
 *
 * `useActionState` en niet een eigen `useState` met een fetch: de uitkomst hoort
 * bij het versturen van dit formulier, en `pending` komt er gratis bij. Zonder
 * die aanduiding klikt iemand twee keer omdat er twee seconden niets gebeurt.
 */
export function SchemaRunner() {
  const [state, action, pending] = useActionState<ActionState>(
    async () => runSchema(),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center self-start bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60"
      >
        {pending ? "Bezig…" : "Tabellen bijwerken"}
      </button>

      {state && <Result state={state} />}
    </form>
  );
}

function Result({ state }: { state: NonNullable<ActionState> }) {
  if (!state.ok) {
    const message = {
      forbidden: "Alleen een beheerder kan dit draaien.",
      "no-db": "Er is geen DATABASE_URL ingesteld.",
      "no-schema":
        "db/schema.sql zit niet in deze deploy. Staat het nog in outputFileTracingIncludes in next.config.ts?",
    }[state.reason];

    return <p className="text-danger">{message}</p>;
  }

  const failed = state.results.filter((entry) => !entry.ok);

  return (
    <div className="flex flex-col gap-3">
      <p className={failed.length === 0 ? "text-primary" : "text-danger"}>
        {failed.length === 0
          ? `Klaar. ${state.results.length} opdrachten, alles gelukt.`
          : `${failed.length} van de ${state.results.length} opdrachten mislukt.`}
      </p>

      <ul className="flex flex-col">
        {state.results.map((entry, index) => (
          <li
            key={index}
            className="flex flex-col gap-1 border-b border-line py-2"
          >
            <span className="flex items-baseline gap-3">
              <span
                className={`font-mono text-11 uppercase ${
                  entry.ok ? "text-faint" : "text-danger"
                }`}
              >
                {entry.ok ? "ok" : "mis"}
              </span>
              <span className="font-mono text-12">{entry.label}</span>
            </span>
            {entry.error && (
              <span className="text-danger">{entry.error}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
