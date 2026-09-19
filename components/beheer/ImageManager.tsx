"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useActionState, useState } from "react";

import {
  type SaveState,
  resetImage,
  saveImage,
} from "@/app/(beheer)/beheer/inhoud/actions";
import { IMAGE_SLOTS } from "@/lib/portal/content-keys";

export type SlotState = {
  key: string;
  src: string;
  width: number;
  height: number;
  /** Of dit het bestand uit de code is of een geüpload bestand. */
  custom: boolean;
};

/**
 * Het wordmark en de achtergrond van de hero.
 *
 * Dat het wordmark vervangen mag worden is geen uitzondering op de harde regel
 * in CLAUDE.md: die verbiedt hertekenen, herkleuren en uitrekken. Een ander
 * aangeleverd bestand erin zetten is iets anders — het bandlogo moest nog komen.
 */
export function ImageManager({ slots }: { slots: SlotState[] }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-11 text-faint uppercase">Beelden</h2>
        <p className="text-muted">
          Vervang je er een, dan blijft het bestand uit de code staan als
          terugval. Met &ldquo;terugzetten&rdquo; ben je weer waar je was.
        </p>
      </div>

      {IMAGE_SLOTS.map((slot) => {
        const current = slots.find((s) => s.key === slot.key);
        return (
          <Slot
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            where={slot.where}
            current={current}
          />
        );
      })}
    </section>
  );
}

function Slot({
  slotKey,
  label,
  where,
  current,
}: {
  slotKey: string;
  label: string;
  where: string;
  current?: SlotState;
}) {
  const [state, setState] = useState<
    { kind: "idle" | "busy" } | { kind: "done" | "error"; message: string }
  >({ kind: "idle" });

  const [resetState, resetAction, resetting] = useActionState<SaveState, FormData>(
    resetImage,
    null,
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("bestand");

    if (!(file instanceof File) || file.size === 0) {
      setState({ kind: "error", message: "Kies eerst een bestand." });
      return;
    }

    setState({ kind: "busy" });

    try {
      // De afmetingen uitlezen vóór het uploaden. next/image heeft ze nodig om
      // ruimte vrij te houden; zonder springt de pagina als het plaatje
      // binnenkomt. Lukt het uitlezen niet, dan slaan we niets op — een beeld
      // zonder afmetingen is erger dan het oude beeld laten staan.
      const size = await readSize(file);
      if (!size) {
        setState({
          kind: "error",
          message:
            "Dit bestand kon niet als afbeelding gelezen worden. Is het echt een JPEG, PNG, WebP of AVIF?",
        });
        return;
      }

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/beheer/upload",
      });

      const data = new FormData();
      data.append("slot", slotKey);
      data.append("url", blob.url);
      data.append("width", String(size.width));
      data.append("height", String(size.height));

      const result = await saveImage(null, data);
      setState(
        result?.ok
          ? { kind: "done", message: result.message }
          : { kind: "error", message: result?.message ?? "Opslaan mislukt." },
      );
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
    <div className="flex flex-col gap-3 border border-line p-4">
      <div className="flex flex-col">
        <span className="font-display text-18 font-bold tracking-tight2 uppercase">
          {label}
        </span>
        <span className="text-muted">{where}</span>
      </div>

      {current && (
        <div className="flex flex-wrap items-center gap-4">
          {/* Op een donkere ondergrond, want daar staat het straks ook op. */}
          <span className="flex items-center justify-center bg-inset p-3">
            <Image
              src={current.src}
              alt=""
              width={current.width}
              height={current.height}
              className="h-16 w-auto object-contain"
            />
          </span>
          <span className="font-mono text-11 text-faint uppercase">
            {current.width}×{current.height}
            {current.custom ? " · geüpload" : " · uit de code"}
          </span>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-wrap items-center gap-4">
        <input
          type="file"
          name="bestand"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="border border-line bg-inset px-4 py-2 text-primary file:mr-4 file:border-0 file:bg-inset file:font-mono file:text-12 file:text-muted file:uppercase"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary disabled:opacity-60"
        >
          {busy ? "Bezig…" : "Vervangen"}
        </button>
      </form>

      {current?.custom && (
        <form action={resetAction} className="flex items-center gap-3">
          <input type="hidden" name="slot" value={slotKey} />
          <button
            type="submit"
            disabled={resetting}
            className="font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary disabled:opacity-60"
          >
            {resetting ? "Bezig…" : "Terug naar het bestand uit de code"}
          </button>
        </form>
      )}

      {state.kind === "done" && <p className="text-muted">{state.message}</p>}
      {state.kind === "error" && <p className="text-danger">{state.message}</p>}
      {resetState && (
        <p className={resetState.ok ? "text-muted" : "text-danger"}>
          {resetState.message}
        </p>
      )}
    </div>
  );
}

/**
 * De afmetingen van een gekozen bestand.
 *
 * `createImageBitmap` is de directe weg en zit in elke browser die dit
 * beheerscherm ooit te zien krijgt. De terugval via een `Image`-element staat
 * er voor het geval een browser het bestandstype niet als bitmap wil decoderen;
 * die weg werkt breder maar is omslachtiger.
 */
async function readSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    // Verder naar de terugval.
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = new window.Image();
    probe.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: probe.naturalWidth, height: probe.naturalHeight });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    probe.src = url;
  });
}
