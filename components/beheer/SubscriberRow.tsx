"use client";

import { useActionState } from "react";

import {
  type RemoveState,
  removeSubscriber,
} from "@/app/(beheer)/beheer/nieuwsbrief/actions";

/**
 * Eén abonnee, met de afmeldknop ernaast.
 *
 * Elke rij heeft zijn eigen formulier en dus zijn eigen `pending`. Eén formulier
 * om de hele lijst heen zou bij het afmelden van de laatste rij ook de eerste op
 * "bezig" zetten.
 */
export function SubscriberRow({
  id,
  email,
  locale,
  confirmedAt,
  wantsNews,
  createdAt,
  canRemove,
}: {
  id: number;
  email: string;
  locale: string;
  confirmedAt: string | null;
  wantsNews: boolean;
  createdAt: string;
  canRemove: boolean;
}) {
  const [state, action, pending] = useActionState<RemoveState, FormData>(
    removeSubscriber,
    null,
  );

  // Na een geslaagde afmelding is de rij weg uit de database maar staat hij nog
  // op het scherm tot de pagina ververst is. Dat is verwarrend, dus zeggen we
  // het gewoon.
  if (state?.ok) {
    return (
      <li className="border-b border-line py-2 text-muted">{state.message}</li>
    );
  }

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-2">
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span>{email}</span>
        <span className="font-mono text-11 text-faint uppercase">
          {locale}
          {" · "}
          {confirmedAt ? "bevestigd" : "nog niet bevestigd"}
          {" · "}
          {wantsNews ? "shows en nieuws" : "alleen shows"}
          {" · "}
          {new Date(createdAt).toLocaleDateString("nl-NL", {
            timeZone: "Europe/Amsterdam",
          })}
        </span>
      </span>

      {canRemove && (
        <span className="flex items-center gap-3">
          {state && !state.ok && (
            <span className="text-danger">{state.message}</span>
          )}
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={pending}
              className="font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-danger disabled:opacity-60"
            >
              {pending ? "Bezig…" : "Afmelden"}
            </button>
          </form>
        </span>
      )}
    </li>
  );
}
