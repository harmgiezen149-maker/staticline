"use client";

import { useActionState, useState } from "react";

import {
  type BandAppState,
  createGig,
  deleteGig,
  updateGig,
} from "@/app/(beheer)/beheer/bandapp/actions";
import {
  isShortLink,
  parseCoordinates,
  roundCoordinate,
} from "@/lib/portal/coordinates";

export type GigValues = {
  id?: number;
  date: string;
  time: string;
  title: string;
  venue: string;
  city: string;
  publicStatus: string;
  ticketUrl: string;
  publicNote: string;
  lat: string;
  lng: string;
};

/**
 * De statussen die de website kent.
 *
 * Dezelfde vier als PUBLIC_STATUS in de Band App. "Release" staat er wel maar
 * wordt niet gebruikt: dit is een coverband. Hij blijft in de lijst omdat het
 * model hem kent en het ontwerp erop kleurt.
 */
const STATUSSEN = [
  { value: "announced", label: "Aangekondigd" },
  { value: "tickets", label: "Kaarten" },
  { value: "soldout", label: "Uitverkocht" },
  { value: "release", label: "Release" },
] as const;

export function GigForm({ gig }: { gig?: GigValues }) {
  const editing = Boolean(gig?.id);
  const [state, action, pending] = useActionState<BandAppState, FormData>(
    editing ? updateGig : createGig,
    null,
  );

  // De coördinaten zijn wél gestuurd in plaats van vrij: een geplakte kaartlink
  // moet ze kunnen invullen.
  const [lat, setLat] = useState(gig?.lat ?? "");
  const [lng, setLng] = useState(gig?.lng ?? "");
  const [linkError, setLinkError] = useState<string | null>(null);

  function applyLink(value: string) {
    if (!value.trim()) {
      setLinkError(null);
      return;
    }

    if (isShortLink(value)) {
      setLinkError(
        "Een verkorte link bevat de coördinaten niet. Open hem en kopieer het adres uit de adresbalk.",
      );
      return;
    }

    const found = parseCoordinates(value);
    if (!found) {
      setLinkError("Hier staan geen coördinaten in.");
      return;
    }

    setLat(String(roundCoordinate(found.lat)));
    setLng(String(roundCoordinate(found.lng)));
    setLinkError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        {gig?.id && <input type="hidden" name="id" value={gig.id} />}

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-11 text-faint uppercase">Datum</span>
            <input
              type="date"
              name="date"
              defaultValue={gig?.date ?? ""}
              className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-11 text-faint uppercase">
              Tijd <span className="normal-case">— op de klok in de zaal</span>
            </span>
            <input
              type="time"
              name="time"
              defaultValue={gig?.time ?? ""}
              className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
            />
          </label>
        </div>

        <Field name="title" label="Titel" value={gig?.title} placeholder="Loburg" />
        <Field name="venue" label="Zaal" value={gig?.venue} placeholder="Loburg" />
        <Field name="city" label="Plaats" value={gig?.city} placeholder="Wageningen" />

        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Status</span>
          <select
            name="publicStatus"
            defaultValue={gig?.publicStatus ?? "announced"}
            className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          >
            {STATUSSEN.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <Field
          name="ticketUrl"
          label="Ticketlink"
          value={gig?.ticketUrl}
          placeholder="https://…"
        />
        <Field
          name="publicNote"
          label="Regel onder de zaalnaam"
          value={gig?.publicNote}
          placeholder="Met support, deuren 20:00"
        />

        <fieldset className="flex flex-col gap-3 border border-line p-4">
          <legend className="flex flex-col">
            <span className="font-mono text-11 text-faint uppercase">
              Op de kaart
            </span>
          </legend>

          <p className="text-muted">
            Zoek de zaal op in Google Maps of OpenStreetMap en plak het adres uit
            de adresbalk. Leeg laten mag: dan staat deze show niet op de kaart.
          </p>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-11 text-faint uppercase">
              Kaartlink plakken
            </span>
            <input
              type="text"
              // Geen `name`: dit veld is een hulpmiddel en wordt niet opgeslagen.
              placeholder="https://www.google.com/maps/place/…"
              onChange={(event) => applyLink(event.target.value)}
              className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
            />
          </label>

          {linkError && <p className="text-danger">{linkError}</p>}

          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-11 text-faint uppercase">
                Breedtegraad
              </span>
              <input
                type="text"
                inputMode="decimal"
                name="lat"
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                placeholder="51.9692"
                className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-11 text-faint uppercase">
                Lengtegraad
              </span>
              <input
                type="text"
                inputMode="decimal"
                name="lng"
                value={lng}
                onChange={(event) => setLng(event.target.value)}
                placeholder="5.6654"
                className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
              />
            </label>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60"
          >
            {pending ? "Bezig…" : editing ? "Opslaan" : "Show toevoegen"}
          </button>
          {state && (
            <span className={state.ok ? "text-muted" : "text-danger"}>
              {state.message}
            </span>
          )}
        </div>
      </form>

      {gig?.id && <DeleteGig id={gig.id} title={gig.title} />}
    </div>
  );
}

function Field({
  name,
  label,
  value,
  placeholder,
}: {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-11 text-faint uppercase">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
      />
    </label>
  );
}

/**
 * Verwijderen, met een tussenstap.
 *
 * Eén klik zou hier een show uit de agenda van de hele band halen, ook uit de
 * app die ze op de repetitie gebruiken. Dat verdient een tweede klik.
 */
function DeleteGig({ id, title }: { id: number; title: string }) {
  const [state, action, pending] = useActionState<BandAppState, FormData>(
    deleteGig,
    null,
  );

  return (
    <details className="border border-line p-4">
      <summary className="cursor-pointer font-mono text-12 text-muted uppercase">
        Deze show verwijderen
      </summary>
      <div className="flex flex-col gap-3 pt-3">
        <p className="text-muted">
          Dit haalt &ldquo;{title}&rdquo; ook uit de Band App, waar de band hem op
          de repetitie ziet staan. Dat is niet ongedaan te maken.
        </p>
        <form action={action} className="flex flex-wrap items-center gap-4">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 text-danger uppercase transition-colors duration-[120ms] hover:border-danger disabled:opacity-60"
          >
            {pending ? "Bezig…" : "Ja, verwijderen"}
          </button>
          {state && (
            <span className={state.ok ? "text-muted" : "text-danger"}>
              {state.message}
            </span>
          )}
        </form>
      </div>
    </details>
  );
}
