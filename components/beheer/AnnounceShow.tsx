"use client";

import { useActionState } from "react";

import {
  type AnnounceState,
  announceAction,
} from "@/app/(beheer)/beheer/nieuwsbrief/actions";

/**
 * Eén show in het nieuwsbriefscherm, met de knoppen die erbij horen.
 *
 * Nu versturen vraagt eerst of je het zeker weet: een mail aan de hele lijst
 * krijg je niet terug. Voorbeeld en overslaan niet — die doen niemand kwaad.
 */
export function AnnounceShow({
  id,
  title,
  meta,
  canSkip,
  sendLabel,
  confirmText,
}: {
  id: number;
  title: string;
  meta: string;
  canSkip: boolean;
  sendLabel: string;
  confirmText: string;
}) {
  const [state, action, pending] = useActionState<AnnounceState, FormData>(
    announceAction,
    null,
  );

  const button = (
    intent: string,
    label: string,
    strong = false,
    confirmMessage?: string,
  ) => (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage))
          event.preventDefault();
      }}
      className={
        strong
          ? "cursor-pointer bg-accent px-4 py-2 font-display text-14 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60"
          : "cursor-pointer font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary disabled:opacity-60"
      }
    >
      {label}
    </button>
  );

  return (
    <li className="flex flex-col gap-2 border-b border-line py-3">
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-display text-16 font-semibold uppercase">
          {title}
        </span>
        <span className="font-mono text-11 text-faint uppercase">{meta}</span>
      </span>
      <form action={action} className="flex flex-wrap items-center gap-4">
        <input type="hidden" name="id" value={id} />
        {button("send", pending ? "Bezig…" : sendLabel, true, confirmText)}
        {button("preview", "Voorbeeld naar mij")}
        {canSkip && button("skip", "Niet aankondigen")}
        {state && (
          <span className={state.ok ? "text-muted" : "text-danger"}>
            {state.message}
          </span>
        )}
      </form>
    </li>
  );
}
