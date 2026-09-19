"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";

import {
  type SaveState,
  addPhoto,
  deleteMedia,
} from "@/app/(beheer)/beheer/inhoud/actions";

export type PhotoItem = {
  id: number;
  url: string;
  alt: string;
  caption: string;
};

/**
 * De foto's op de homepage en de fotopagina.
 *
 * Het uploaden gaat rechtstreeks van de browser naar de Blob-opslag; deze site
 * geeft er alleen een kortlopende sleutel voor af. Dat moet ook wel: een
 * serverloze functie op Vercel neemt hooguit 4,5 MB aan verzoek aan en daar zit
 * een persfoto zo overheen.
 *
 * Daarom geen gewoon formulier met een server action. Eerst uploaden, dan pas de
 * rij aanmelden — twee stappen die de gebruiker als één handeling ziet, met één
 * stand voor allebei.
 */
export function PhotoManager({ photos }: { photos: PhotoItem[] }) {
  const [state, setState] = useState<
    { kind: "idle" | "busy" } | { kind: "done" | "error"; message: string }
  >({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("bestand");
    const alt = String(data.get("alt") ?? "").trim();

    if (!(file instanceof File) || file.size === 0) {
      setState({ kind: "error", message: "Kies eerst een bestand." });
      return;
    }
    if (!alt) {
      setState({
        kind: "error",
        message:
          "Beschrijf wat er op de foto te zien is. Dat is wat een blinde bezoeker voorgelezen krijgt, en wat in de zoekresultaten meetelt.",
      });
      return;
    }

    setState({ kind: "busy" });

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/beheer/upload",
      });

      const result = await addPhoto(
        null,
        toFormData({
          url: blob.url,
          alt,
          caption: String(data.get("caption") ?? ""),
        }),
      );

      if (result?.ok) {
        formRef.current?.reset();
        setState({ kind: "done", message: result.message });
      } else {
        setState({
          kind: "error",
          message: result?.message ?? "Toevoegen mislukt.",
        });
      }
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Het uploaden lukte niet. Probeer het nog eens.",
      });
    }
  }

  const busy = state.kind === "busy";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-11 text-faint uppercase">Foto&apos;s</h2>
        <p className="text-muted">
          Het ontwerp rekent op vijf beelden. Meer mag, maar dan wordt de indeling
          iets anders dan getekend. JPEG, PNG, WebP of AVIF, tot 10 MB.
        </p>
      </div>

      {photos.length === 0 ? (
        <p className="text-muted">
          Nog geen foto&apos;s. De fotosecties tonen zolang de benoemde
          placeholders uit het ontwerp.
        </p>
      ) : (
        <ul className="flex flex-col">
          {photos.map((photo) => (
            <PhotoRow key={photo.id} photo={photo} />
          ))}
        </ul>
      )}

      <form ref={formRef} onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Bestand</span>
          <input
            type="file"
            name="bestand"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="border border-line bg-inset px-4 py-3 text-primary file:mr-4 file:border-0 file:bg-inset file:font-mono file:text-12 file:text-muted file:uppercase"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">
            Wat is er te zien
          </span>
          <input
            type="text"
            name="alt"
            placeholder="Static Line op het podium in Loburg"
            className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">
            Bijschrift <span className="normal-case">— mag leeg</span>
          </span>
          <input
            type="text"
            name="caption"
            placeholder="Loburg 2026"
            className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary disabled:opacity-60"
          >
            {busy ? "Bezig met uploaden…" : "Foto toevoegen"}
          </button>
          {state.kind === "done" && (
            <span className="text-muted">{state.message}</span>
          )}
          {state.kind === "error" && (
            <span className="text-danger">{state.message}</span>
          )}
        </div>
      </form>
    </section>
  );
}

function PhotoRow({ photo }: { photo: PhotoItem }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    deleteMedia,
    null,
  );

  if (state?.ok) {
    return (
      <li className="border-b border-line py-2 text-muted">
        De foto is verwijderd.
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line py-2">
      <span className="flex items-center gap-4">
        <Image
          src={photo.url}
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 object-cover"
        />
        <span className="flex flex-col">
          <span>{photo.alt}</span>
          {photo.caption && (
            <span className="font-mono text-11 text-faint uppercase">
              {photo.caption}
            </span>
          )}
        </span>
      </span>

      <span className="flex items-center gap-3">
        {state && !state.ok && <span className="text-danger">{state.message}</span>}
        <form action={action}>
          <input type="hidden" name="id" value={photo.id} />
          <button
            type="submit"
            disabled={pending}
            className="font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-danger disabled:opacity-60"
          >
            {pending ? "Bezig…" : "Verwijderen"}
          </button>
        </form>
      </span>
    </li>
  );
}

function toFormData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}
