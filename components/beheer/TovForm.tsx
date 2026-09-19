"use client";

import { useActionState, useState } from "react";

import { type TovState, type Uitvoer, herschrijf } from "@/app/(beheer)/beheer/tov/actions";
import type { TextType } from "@/lib/tov/config";
import { SOURCE_KEYS, SOURCE_LABELS, type SourceKey, type SourceOptions } from "@/lib/tov/factsheet";

/**
 * Het schrijfscherm.
 *
 * Twee standen. **Herschrijven** is de oude: één tekst erin, twee eruit, en de
 * aangeleverde tekst is meteen de bron waar de feiten tegen nagerekend worden.
 * **Schrijven** heeft geen brontekst, en dus moeten de feiten ergens anders
 * vandaan komen — vandaar de bronvinkjes en de onderwerpkiezer.
 *
 * Vink niet meer aan dan nodig. Dat is geen zuinigheid: alles in het feitenblad
 * mag het model zeggen, dus een breed feitenblad is een slappe controle. De
 * standaard per teksttype staat in content/tov-config.json.
 */

const VELD =
  "border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong";
const LABEL = "font-mono text-11 text-faint uppercase";

export function TovForm({
  types,
  maxChars,
  maxBriefChars,
  options,
}: {
  types: TextType[];
  maxChars: number;
  maxBriefChars: number;
  options: SourceOptions;
}) {
  const [state, action, pending] = useActionState<TovState, FormData>(
    herschrijf,
    null,
  );

  const [mode, setMode] = useState<"rewrite" | "brief">("rewrite");
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [lengte, setLengte] = useState(0);
  const [briefLengte, setBriefLengte] = useState(0);

  const type = types.find((t) => t.id === typeId) ?? types[0];

  // De bronnen volgen het teksttype, tot je ze zelf aanraakt. Daarna blijft je
  // keuze staan: wie bewust de agenda uitvinkt, wil hem niet terug bij het
  // volgende type.
  const [keys, setKeys] = useState<SourceKey[]>(type?.sources ?? []);
  const [aangeraakt, setAangeraakt] = useState(false);

  function kiesType(id: string) {
    setTypeId(id);
    if (!aangeraakt) {
      setKeys(types.find((t) => t.id === id)?.sources ?? []);
    }
  }

  function wissel(key: SourceKey) {
    setAangeraakt(true);
    setKeys((huidig) =>
      huidig.includes(key) ? huidig.filter((k) => k !== key) : [...huidig, key],
    );
  }

  const schrijven = mode === "brief";
  const onderwerpen =
    type?.subject === "member"
      ? options.members
      : type?.subject === "gig"
        ? options.upcoming
        : type?.subject === "past_gig"
          ? options.past
          : [];

  return (
    <div className="flex flex-col gap-8">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />

        <div className="flex flex-col gap-1">
          <span className={LABEL}>Wat wil je doen</span>
          {/* Op een telefoon onder elkaar en allebei even breed; vanaf tablet
              naast elkaar op hun eigen breedte, randen tegen elkaar aan. */}
          <div className="flex flex-col sm:flex-row">
            {(
              [
                ["rewrite", "Herschrijven", "Je hebt al een tekst"],
                ["brief", "Schrijven", "Je hebt een onderwerp"],
              ] as const
            ).map(([waarde, titel, uitleg]) => (
              <button
                key={waarde}
                type="button"
                onClick={() => setMode(waarde)}
                aria-pressed={mode === waarde}
                className={`flex flex-col gap-1 border px-4 py-3 text-left transition-colors duration-[120ms] ${
                  mode === waarde
                    ? "border-line-strong bg-inset text-primary"
                    : "border-line text-muted hover:text-primary"
                }`}
              >
                <span className="font-display font-bold tracking-wide12 uppercase">
                  {titel}
                </span>
                <span className="text-12 text-muted">{uitleg}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className={LABEL}>Teksttype</span>
          <select
            name="textType"
            value={typeId}
            onChange={(event) => kiesType(event.target.value)}
            className={VELD}
          >
            {types.map((optie) => (
              <option key={optie.id} value={optie.id}>
                {optie.label} — max {optie.maxWords} woorden
              </option>
            ))}
          </select>
          {type && <span className="text-muted">{type.hint}</span>}
        </label>

        {schrijven ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between gap-4">
                <span className={LABEL}>Opdracht</span>
                <span
                  className={`font-mono text-11 ${briefLengte > maxBriefChars ? "text-danger" : "text-faint"}`}
                >
                  {briefLengte} / {maxBriefChars}
                </span>
              </span>
              <textarea
                name="brief"
                rows={3}
                onChange={(event) => setBriefLengte(event.target.value.length)}
                placeholder="Bijvoorbeeld: een korte aankondiging voor Facebook en Instagram."
                className={VELD}
              />
              <span className="text-muted">
                Wat er geschreven moet worden. Niet wat waar is — dat komt uit de
                bronnen hieronder.
              </span>
            </label>

            {onderwerpen.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className={LABEL}>
                  Waar gaat het over{" "}
                  <span className="normal-case">— mag leeg</span>
                </span>
                <select name="subjectId" defaultValue="" className={VELD}>
                  <option value="">Niets in het bijzonder</option>
                  {onderwerpen.map((optie) => (
                    <option key={optie.id} value={optie.id}>
                      {optie.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <fieldset className="flex flex-col gap-2 border border-line p-4">
              <legend className={`${LABEL} px-2`}>Bronnen</legend>
              <p className="text-muted">
                Alleen wat je aanvinkt mag in de tekst komen. Vink niet meer aan
                dan nodig: hoe breder de bron, hoe meer er waar is en hoe minder
                de controle op verzonnen feiten betekent.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {SOURCE_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="sources"
                      value={key}
                      checked={keys.includes(key)}
                      onChange={() => wissel(key)}
                      className="size-4 accent-[var(--accent)]"
                    />
                    <span>{SOURCE_LABELS[key]}</span>
                  </label>
                ))}
              </div>
              {!options.available && (
                <p className="text-danger">
                  De Band App is nu niet bereikbaar. De band, de leden, de agenda
                  en de setlist blijven daardoor leeg.
                </p>
              )}
            </fieldset>

            <label className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between gap-4">
                <span className={LABEL}>
                  Aantekeningen <span className="normal-case">— mag leeg</span>
                </span>
                <span
                  className={`font-mono text-11 ${lengte > maxChars ? "text-danger" : "text-faint"}`}
                >
                  {lengte} / {maxChars}
                </span>
              </span>
              <textarea
                name="notes"
                rows={5}
                onChange={(event) => setLengte(event.target.value.length)}
                placeholder="120 man, snaar gebroken in nummer drie, de bar was door het bier heen."
                className={VELD}
              />
              <span className="text-muted">
                Feiten die nergens in de app staan. Dit telt als bron: wat je hier
                schrijft mag in de tekst, de rest niet.
              </span>
            </label>

            {type?.maxWordsLong && (
              <fieldset className="flex flex-wrap items-center gap-6">
                <legend className={`${LABEL} mb-1`}>Lengte</legend>
                {(
                  [
                    ["kort", `Kort — max ${type.maxWords} woorden`],
                    ["lang", `Lang — max ${type.maxWordsLong} woorden`],
                  ] as const
                ).map(([waarde, label]) => (
                  <label key={waarde} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="long"
                      value={waarde}
                      defaultChecked={waarde === "kort"}
                      className="size-4 accent-[var(--accent)]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-4">
              <span className={LABEL}>
                Je tekst <span className="normal-case">— Nederlands of Engels</span>
              </span>
              <span
                className={`font-mono text-11 ${lengte > maxChars ? "text-danger" : "text-faint"}`}
              >
                {lengte} / {maxChars}
              </span>
            </span>
            <textarea
              name="text"
              rows={8}
              onChange={(event) => setLengte(event.target.value.length)}
              placeholder="Plak hier de tekst die je wilt herschrijven."
              className={VELD}
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className={LABEL}>
            Achtergrond <span className="normal-case">— mag leeg</span>
          </span>
          <input
            type="text"
            name="context"
            placeholder="Bijvoorbeeld: voor Instagram, of voor festival X"
            className={VELD}
          />
          <span className="text-muted">
            Dit is achtergrond voor de toon, geen bron voor nieuwe feiten. Wat
            hier staat, komt niet als feit in de tekst.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Bezig…" : schrijven ? "Schrijven" : "Herschrijven"}
          </button>
          {pending && (
            <span className="text-muted">
              Dit duurt even: hij schrijft, rekent het na en verbetert zo nodig
              nog een keer.
            </span>
          )}
          {state && !state.ok && (
            <span className="text-danger">{state.message}</span>
          )}
        </div>
      </form>

      {state?.ok && (
        <div className="flex flex-col gap-6">
          {state.flags.length > 0 && (
            <section className="flex flex-col gap-2 border border-line-strong p-4">
              <h2 className={LABEL}>Let op</h2>
              <ul className="flex flex-col gap-1">
                {state.flags.map((flag, index) => (
                  <li key={index} className="text-danger">
                    {flag.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Vak titel="Nederlands" uitvoer={state.nl} />
            <Vak titel="Engels" uitvoer={state.en} />
          </div>
        </div>
      )}
    </div>
  );
}

function Vak({ titel, uitvoer }: { titel: string; uitvoer: Uitvoer }) {
  const [gekopieerd, setGekopieerd] = useState(false);

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(uitvoer.text);
      setGekopieerd(true);
      window.setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      // Zonder toestemming op het klembord valt er niets te melden dat helpt;
      // de tekst staat gewoon te selecteren.
    }
  }

  return (
    <section className="flex flex-col gap-3 border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-18 font-bold tracking-tight2 uppercase">
          {titel}
        </h2>
        <span className="flex items-baseline gap-4">
          <span className={LABEL}>{uitvoer.wordCount} woorden</span>
          <button
            type="button"
            onClick={kopieer}
            className="font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
          >
            {gekopieerd ? "Gekopieerd" : "Kopieer"}
          </button>
        </span>
      </div>

      {/* Invoer van een mens; React ontsnapt de inhoud zelf. `pre-wrap` houdt
          de regelovergangen die het model gezet heeft. */}
      <p className="whitespace-pre-wrap">{uitvoer.text}</p>

      {uitvoer.changes.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <span className={LABEL}>Wat hij gedaan heeft</span>
          <ul className="flex flex-col gap-1">
            {uitvoer.changes.map((change, index) => (
              <li key={index} className="text-muted">
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
