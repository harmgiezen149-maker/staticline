"use client";

import { useActionState } from "react";

import {
  type IssueState,
  issueAction,
} from "@/app/(beheer)/beheer/nieuwsbrief/actions";

/**
 * Het schrijfscherm voor een nieuwsbrief.
 *
 * Eén formulier met vijf knoppen. Elke knop slaat eerst op (zie issueAction),
 * dus wat je ziet is wat er gaat. Versturen vraagt of je het zeker weet, met het
 * aantal adressen erbij: een mail aan de lijst krijg je niet terug.
 *
 * Gewone tekst en geen opmaak. Een lege regel wordt een witregel, en een adres
 * dat met https:// begint, wordt vanzelf een link. Dat is met opzet zo sober: zie
 * lib/mail-html.ts.
 */
export function IssueEditor({
  id,
  initial,
  editable,
  audience,
  today,
  notice,
}: {
  id?: number;
  initial: {
    subject_nl: string;
    body_nl: string;
    subject_en: string;
    body_en: string;
    scheduled_for: string | null;
  };
  editable: boolean;
  /** Hoeveel adressen ander nieuws willen. */
  audience: number;
  today: string;
  notice?: string;
}) {
  const [state, action, pending] = useActionState<IssueState, FormData>(
    issueAction,
    null,
  );
  const message = state ?? (notice ? { ok: true, message: notice } : null);

  const field =
    "border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong disabled:opacity-70";
  const label = "font-mono text-11 text-faint uppercase";
  const quiet =
    "cursor-pointer font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary disabled:opacity-60";
  const strong =
    "cursor-pointer bg-accent px-5 py-3 font-display text-14 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60";
  const plain =
    "cursor-pointer border border-line-strong px-5 py-3 font-display text-14 font-bold tracking-wide12 text-primary uppercase transition-colors duration-[120ms] enabled:hover:border-primary disabled:opacity-60";

  return (
    <form action={action} className="flex max-w-[720px] flex-col gap-6">
      {id && <input type="hidden" name="id" value={id} />}

      <fieldset className="flex flex-col gap-4" disabled={!editable || pending}>
        <label className="flex flex-col gap-1">
          <span className={label}>Onderwerp</span>
          <input
            name="subject_nl"
            defaultValue={initial.subject_nl}
            maxLength={200}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Tekst</span>
          <textarea
            name="body_nl"
            defaultValue={initial.body_nl}
            rows={14}
            className={`${field} leading-[24px]`}
            placeholder={"Hoi,\n\n…"}
          />
          <span className="text-14 text-muted">
            Gewone tekst. Een lege regel wordt een witregel, een adres met
            https:// een link. Ondertekening en afmeldlink komen er vanzelf
            onder. De toon laten nakijken kan op{" "}
            <a href="/beheer/tov" className="underline hover:text-primary">
              /beheer/tov
            </a>
            .
          </span>
        </label>

        <details
          className="border border-line p-4"
          open={Boolean(initial.subject_en || initial.body_en)}
        >
          <summary className="cursor-pointer font-mono text-11 text-faint uppercase">
            Engelse versie (niet verplicht)
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-14 text-muted">
              Leeg laten mag: dan krijgen Engelstalige abonnees de Nederlandse
              tekst. Vul je iets in, dan allebei — een Engels onderwerp boven
              een Nederlandse tekst leest als een fout.
            </p>
            <label className="flex flex-col gap-1">
              <span className={label}>Subject</span>
              <input
                name="subject_en"
                defaultValue={initial.subject_en}
                maxLength={200}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>Text</span>
              <textarea
                name="body_en"
                defaultValue={initial.body_en}
                rows={10}
                className={`${field} leading-[24px]`}
              />
            </label>
          </div>
        </details>
      </fieldset>

      {editable ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              name="intent"
              value="save"
              disabled={pending}
              className={plain}
            >
              {pending ? "Bezig…" : "Opslaan"}
            </button>
            <button
              type="submit"
              name="intent"
              value="preview"
              disabled={pending}
              className={quiet}
            >
              Voorbeeld naar mij
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4 border-t border-line pt-4">
            <label className="flex flex-col gap-1">
              <span className={label}>Versturen op</span>
              <input
                type="date"
                name="scheduled_for"
                min={today}
                defaultValue={initial.scheduled_for ?? ""}
                className={field}
              />
            </label>
            <button
              type="submit"
              name="intent"
              value="schedule"
              disabled={pending}
              className={plain}
            >
              Inplannen
            </button>
            <span className="text-14 text-muted">
              gaat mee met de ochtendronde van die dag
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
            <button
              type="submit"
              name="intent"
              value="send"
              disabled={pending || audience === 0}
              className={strong}
              onClick={(event) => {
                if (
                  !window.confirm(
                    `Deze nieuwsbrief nu naar ${audience} adressen mailen? Dat is niet terug te draaien.`,
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              Nu versturen
            </button>
            <span className="text-14 text-muted">
              {audience === 0
                ? "Nog niemand heeft ander nieuws aangezet."
                : `naar ${audience} ${audience === 1 ? "adres" : "adressen"} dat ook ander nieuws wil`}
            </span>
            {id && (
              <button
                type="submit"
                name="intent"
                value="delete"
                disabled={pending}
                className={`${quiet} ml-auto hover:text-danger`}
                onClick={(event) => {
                  if (!window.confirm("Dit concept weggooien?"))
                    event.preventDefault();
                }}
              >
                Weggooien
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted">
          Deze nieuwsbrief is verstuurd en staat hier als archief.
        </p>
      )}

      {message && (
        <p
          className={message.ok ? "text-accent-alt" : "text-danger"}
          role="status"
        >
          {message.message}
        </p>
      )}
    </form>
  );
}
