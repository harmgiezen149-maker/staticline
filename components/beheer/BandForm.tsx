"use client";

import { useActionState } from "react";

import { type BandAppState, saveBand } from "@/app/(beheer)/beheer/bandapp/actions";

/**
 * De bandgegevens, zoals ze in de Band App staan.
 *
 * Dit schrijft naar de andere applicatie. De bio die hier staat, is dezelfde die
 * de band op het ledenscherm in de app ziet — niet een kopie ervan. Dat is met
 * opzet: twee plekken met elk hun eigen bio is precies het probleem dat
 * docs/04-band-app-integration.md wilde voorkomen.
 */
export function BandForm({
  name,
  bio,
  logoUrl,
}: {
  name: string;
  bio: string;
  logoUrl: string;
}) {
  const [state, action, pending] = useActionState<BandAppState, FormData>(
    saveBand,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-11 text-faint uppercase">Bandnaam</span>
        <input
          type="text"
          name="name"
          defaultValue={name}
          className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-11 text-faint uppercase">
          Bio <span className="normal-case">— staat op /band en in de app</span>
        </span>
        <textarea
          name="bio"
          rows={6}
          defaultValue={bio}
          className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-11 text-faint uppercase">
          Logo <span className="normal-case">— volledig adres, mag leeg</span>
        </span>
        <input
          type="text"
          name="logoUrl"
          defaultValue={logoUrl}
          placeholder="https://…"
          className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
        />
      </label>

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
