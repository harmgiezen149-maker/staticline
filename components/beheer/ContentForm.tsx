"use client";

import { useActionState } from "react";

import { type SaveState, saveAll } from "@/app/(beheer)/beheer/inhoud/actions";
import {
  SOCIAL_KEYS,
  SPOTIFY_KEYS,
  TEXT_KEYS,
  type SettingKey,
} from "@/lib/portal/content-keys";

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
  values,
  stale,
}: {
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
            Leeg laten betekent: gebruik de tekst die er nu in de code staat. Je
            kunt dus niets stukmaken door een veld leeg te maken.
          </p>
        </div>

        {TEXT_KEYS.map((field) => (
          <fieldset key={field.key} className="flex flex-col gap-3">
            <legend className="flex flex-col">
              <span className="font-display text-18 font-bold tracking-tight2 uppercase">
                {field.label}
              </span>
              <span className="text-muted">{field.where}</span>
            </legend>

            {stale[field.key] && (
              // Alleen een melding, geen terugval. Anders dan bij de teksten uit
              // de Band App staan hier beide talen onder elkaar op dit scherm —
              // je ziet het verschil. Stil van taal wisselen op een gepubliceerde
              // pagina is erger dan een waarschuwing die je ziet staan.
              <p className="text-danger">
                De Nederlandse tekst is gewijzigd sinds deze vertaling. Het Engels
                staat nog zoals het was.
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
                    placeholder={values[`fallback:${field.key}|${locale}`] ?? ""}
                    className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
                  />
                ) : (
                  <input
                    type="text"
                    name={`${field.key}|${locale}`}
                    defaultValue={values[`${field.key}|${locale}`] ?? ""}
                    placeholder={values[`fallback:${field.key}|${locale}`] ?? ""}
                    className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
                  />
                )}
              </label>
            ))}
          </fieldset>
        ))}
      </section>

      <Settings
        title="Spotify"
        intro="Uit de deellink van het artiestenprofiel. Laat het id leeg om de Spotify-sectie weg te laten."
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
