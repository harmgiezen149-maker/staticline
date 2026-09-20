"use client";

import { useActionState } from "react";

import { type SaveState, saveAll } from "@/app/(beheer)/beheer/inhoud/actions";
import {
  SOCIAL_KEYS,
  SPOTIFY_KEYS,
  type SettingKey,
} from "@/lib/portal/content-keys";
import type { CopyGroup } from "@/lib/portal/copy-keys";

/**
 * De teksten en instellingen, in één formulier.
 *
 * Eén opslaanknop voor alles. Een knop per veld zou preciezer zijn, maar dan
 * klik je twaalf keer om een ondertitel in twee talen aan te passen.
 *
 * Elk veld toont als plaatshouder wat er nu op de site staat. Leeg laten
 * betekent dan letterlijk "houd wat er staat", en dat is precies wat er gebeurt.
 */
export function ContentForm({
  groups,
  values,
  stale,
}: {
  /** Alle teksten van de site, per onderdeel. Komt uit content/nl.ts. */
  groups: CopyGroup[];
  values: Record<string, string>;
  /** Per tekst: of het Engels niet meer bij het Nederlands hoort. */
  stale: Record<string, boolean>;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveAll,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-11 text-faint uppercase">Teksten</h2>
          <p className="text-muted">
            Elke tekst van de site staat hier. Leeg laten betekent: gebruik wat
            er nu in de code staat — je kunt dus niets stukmaken door een veld
            leeg te maken. In het veld zelf zie je grijs wat er nu staat.
          </p>
        </div>

        {/* Per onderdeel, dichtgeklapt. Ruim honderd teksten in twee talen onder
            elkaar is onleesbaar; zo open je het blok dat je zoekt en blijft de
            rest weg. `<details>` en geen eigen schakelaar: dan werkt zoeken in
            de pagina ook, en is er geen JavaScript voor nodig. */}
        {groups.map((group) => (
          <details key={group.key} className="border border-line">
            <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 px-4 py-3">
              <span className="font-display text-18 font-bold tracking-tight2 uppercase">
                {group.label}
              </span>
              <span className="text-muted">{group.where}</span>
              <span className="ml-auto font-mono text-11 text-faint">
                {group.fields.length}
              </span>
            </summary>

            <div className="flex flex-col gap-6 border-t border-line px-4 py-5">
              {group.fields.map((field) => (
                <fieldset key={field.key} className="flex flex-col gap-3">
                  <legend className="font-mono text-12 text-muted">
                    {field.name}
                  </legend>

                  {stale[field.key] && (
                    // Alleen een melding, geen terugval. Anders dan bij de teksten uit
                    // de Band App staan hier beide talen onder elkaar op dit scherm —
                    // je ziet het verschil. Stil van taal wisselen op een gepubliceerde
                    // pagina is erger dan een waarschuwing die je ziet staan.
                    <p className="text-danger">
                      De Nederlandse tekst is gewijzigd sinds deze vertaling.
                      Het Engels staat nog zoals het was.
                    </p>
                  )}

                  {(["nl", "en"] as const).map((locale) => (
                    <label key={locale} className="flex flex-col gap-1">
                      <span className="font-mono text-11 text-faint uppercase">
                        {locale === "nl" ? "Nederlands" : "Engels"}
                      </span>
                      {field.long ? (
                        <textarea
                          name={`${field.key}|${locale}`}
                          rows={3}
                          defaultValue={values[`${field.key}|${locale}`] ?? ""}
                          placeholder={
                            values[`fallback:${field.key}|${locale}`] ?? ""
                          }
                          className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
                        />
                      ) : (
                        <input
                          type="text"
                          name={`${field.key}|${locale}`}
                          defaultValue={values[`${field.key}|${locale}`] ?? ""}
                          placeholder={
                            values[`fallback:${field.key}|${locale}`] ?? ""
                          }
                          className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
                        />
                      )}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </details>
        ))}
      </section>

      <Settings
        title="Spotify"
        intro="Plak de deellink van Spotify. Laat het veld leeg om de Spotify-sectie weg te laten."
        fields={SPOTIFY_KEYS}
        values={values}
      />

      <Settings
        title="Sociale kanalen"
        intro="Het volledige adres. Wat je leeg laat, verschijnt niet in de voettekst."
        fields={SOCIAL_KEYS}
        values={values}
      />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover disabled:opacity-60"
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

function Settings({
  title,
  intro,
  fields,
  values,
}: {
  title: string;
  intro: string;
  fields: SettingKey[];
  values: Record<string, string>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-11 text-faint uppercase">{title}</h2>
      <p className="text-muted">{intro}</p>
      {fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">
            {field.label}
          </span>
          <input
            type="text"
            name={`${field.key}|`}
            defaultValue={values[`${field.key}|`] ?? ""}
            placeholder={field.hint}
            className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
        </label>
      ))}
    </section>
  );
}
