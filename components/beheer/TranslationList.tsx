"use client";

import { useActionState } from "react";

import {
  type TranslateState,
  saveTranslation,
  translateMissing,
} from "@/app/(beheer)/beheer/vertalingen/actions";

export type TranslationItem = {
  id: string;
  label: string;
  source: string;
  translation: string;
  status: "missing" | "current" | "stale";
};

const STATUS_LABELS = {
  missing: "nog niet vertaald",
  current: "actueel",
  stale: "verouderd",
} as const;

/**
 * De vertalingen, met de Nederlandse tekst ernaast.
 *
 * Naast elkaar en niet in twee schermen: je beoordeelt een vertaling door hem met
 * het origineel te vergelijken, en dat werkt niet als je ervoor moet klikken.
 */
export function TranslationList({ items }: { items: TranslationItem[] }) {
  const [state, action, pending] = useActionState<TranslateState, FormData>(
    translateMissing,
    null,
  );

  const todo = items.filter((item) => item.status !== "current").length;

  return (
    <div className="flex flex-col gap-8">
      <form action={action} className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || todo === 0}
          className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover disabled:opacity-60"
        >
          {pending
            ? "Bezig met vertalen…"
            : todo === 0
              ? "Alles is actueel"
              : `Vertaal ${todo} ${todo === 1 ? "tekst" : "teksten"}`}
        </button>
        {state && (
          <span className={state.ok ? "text-muted" : "text-danger"}>
            {state.message}
          </span>
        )}
      </form>

      {items.length === 0 ? (
        <p className="text-muted">
          Er valt niets te vertalen. Zodra er een bandbio of een tekst per lid in
          de Band App staat, verschijnt die hier.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ item }: { item: TranslationItem }) {
  const [state, action, pending] = useActionState<TranslateState, FormData>(
    saveTranslation,
    null,
  );

  return (
    <li className="flex flex-col gap-3 border border-line-default p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-display text-18 font-bold tracking-tight2 uppercase">
          {item.label}
        </span>
        <span
          className={`font-mono text-11 uppercase ${
            item.status === "current" ? "text-faint" : "text-danger"
          }`}
        >
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      {item.status === "stale" && (
        <p className="text-muted">
          De Nederlandse tekst is gewijzigd sinds deze vertaling gemaakt is. De
          site toont zolang het Nederlands.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-mono text-11 text-faint uppercase">Nederlands</span>
        <p className="whitespace-pre-wrap text-muted">{item.source}</p>
      </div>

      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={item.id} />
        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Engels</span>
          <textarea
            name="text"
            rows={item.source.length > 120 ? 5 : 2}
            defaultValue={item.translation}
            className="border border-line-default bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary disabled:opacity-60"
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
    </li>
  );
}
