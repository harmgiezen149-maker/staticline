"use client";

import { useActionState } from "react";

import { type SaveState, saveBooking } from "@/app/(beheer)/beheer/boekingen/actions";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/portal/booking-status";

/**
 * Status en notitie van één aanvraag.
 *
 * Eén formulier voor allebei. Een aparte knop per status zou sneller klikken
 * zijn, maar dan raak je een notitie kwijt die je net aan het typen was.
 */
export function BookingEditor({
  id,
  status,
  note,
}: {
  id: number;
  status: Status;
  note: string;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveBooking,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />

      <fieldset className="flex flex-col gap-2">
        <legend className="font-mono text-11 text-faint uppercase">Status</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {STATUSES.map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value={value}
                defaultChecked={value === status}
                className="accent-accent"
              />
              <span>{STATUS_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-11 text-faint uppercase">
          Notitie <span className="normal-case">— alleen voor de band</span>
        </span>
        <textarea
          name="note"
          rows={4}
          defaultValue={note}
          className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60"
        >
          {pending ? "Bezig…" : "Opslaan"}
        </button>

        {state && (
          <span className={state.ok ? "text-muted" : "text-danger"}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
