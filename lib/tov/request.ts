/**
 * Wat er uit een formulier of een JSON-body komt, gecontroleerd.
 *
 * Twee schermen sturen hetzelfde: /beheer/tov via een server action en de Band
 * App via /api/tov. Als beide kanten hun eigen controle schrijven, lopen die
 * vroeg of laat uit elkaar — en dan is het net de kant met de soepelste
 * controle waar een lege opdracht of een onbekende bron doorheen glipt.
 *
 * Zonder imports naar `@/`, zodat `npm test` het kan draaien.
 */

import { type SourceKey, isSourceKey } from "./factsheet.ts";

export type Parsed =
  | { ok: true; value: ParsedRequest }
  | { ok: false; error: ParseError };

export type ParseError =
  | "geen-tekst"
  | "geen-opdracht"
  | "te-lang"
  | "opdracht-te-lang"
  | "onbekende-stand";

export type ParsedRequest = {
  mode: "rewrite" | "brief";
  /** De te herschrijven tekst. Leeg in de schrijfstand. */
  input: string;
  /** De opdracht. Leeg in de herschrijfstand. */
  brief: string;
  /** Feiten die de schrijver zelf aanlevert. Alleen in de schrijfstand. */
  notes: string;
  keys: SourceKey[];
  subjectId: number | null;
  long: boolean;
  context: string;
};

export type Limits = { maxInputChars: number; maxBriefChars: number };

/** Een waarde uit een formulier of een JSON-body, als tekst. */
const tekst = (waarde: unknown) => (typeof waarde === "string" ? waarde.trim() : "");

/**
 * Een lijst bronsleutels, ontdaan van wat niet bestaat.
 *
 * Een onbekende sleutel is geen fout die het verzoek hoort tegen te houden: het
 * is een oud scherm of een typefout, en de gevolgen zijn een smaller feitenblad
 * en niet een verkeerd feitenblad. Wat er niet in staat, mag het model ook niet
 * zeggen — dus stil weglaten is hier veilig.
 */
export function parseKeys(waarden: unknown[]): SourceKey[] {
  const gezien = new Set<SourceKey>();
  for (const waarde of waarden) {
    const key = tekst(waarde);
    if (isSourceKey(key)) gezien.add(key);
  }
  return [...gezien];
}

/** Een id uit een keuzelijst. Leeg of onzin wordt null: "geen onderwerp gekozen". */
export function parseId(waarde: unknown): number | null {
  const ruw = tekst(waarde);
  if (!ruw) return null;

  const getal = Number(ruw);
  return Number.isInteger(getal) && getal > 0 ? getal : null;
}

export function parseRequest(
  raw: {
    mode?: unknown;
    text?: unknown;
    brief?: unknown;
    notes?: unknown;
    sources?: unknown;
    subjectId?: unknown;
    long?: unknown;
    context?: unknown;
  },
  limits: Limits,
): Parsed {
  // Geen `mode` betekent herschrijven. De Band App draaide een versie zonder dit
  // veld; die hoort te blijven werken zolang hij nog niet uitgerold is.
  const ruweStand = tekst(raw.mode) || "rewrite";
  if (ruweStand !== "rewrite" && ruweStand !== "brief") {
    return { ok: false, error: "onbekende-stand" };
  }

  const mode = ruweStand;
  const context = tekst(raw.context).slice(0, 1000);
  const input = tekst(raw.text);
  const brief = tekst(raw.brief);
  const notes = tekst(raw.notes);

  if (mode === "rewrite") {
    if (!input) return { ok: false, error: "geen-tekst" };
    if (input.length > limits.maxInputChars) return { ok: false, error: "te-lang" };

    return {
      ok: true,
      value: { mode, input, brief: "", notes: "", keys: [], subjectId: null, long: false, context },
    };
  }

  if (!brief) return { ok: false, error: "geen-opdracht" };
  if (brief.length > limits.maxBriefChars) {
    return { ok: false, error: "opdracht-te-lang" };
  }
  if (notes.length > limits.maxInputChars) return { ok: false, error: "te-lang" };

  return {
    ok: true,
    value: {
      mode,
      input: "",
      brief,
      notes,
      keys: parseKeys(Array.isArray(raw.sources) ? raw.sources : []),
      subjectId: parseId(raw.subjectId),
      long: raw.long === true || tekst(raw.long) === "lang",
      context,
    },
  };
}

/** Waarom een verzoek geweigerd is, in gewone taal. */
export function reasonFor(error: ParseError, limits: Limits): string {
  switch (error) {
    case "geen-tekst":
      return "Plak eerst een tekst.";
    case "geen-opdracht":
      return "Schrijf eerst een opdracht: wat moet er geschreven worden?";
    case "te-lang":
      return `De tekst is langer dan ${limits.maxInputChars} tekens.`;
    case "opdracht-te-lang":
      return `De opdracht is langer dan ${limits.maxBriefChars} tekens. Zet feiten bij de aantekeningen, niet in de opdracht.`;
    case "onbekende-stand":
      return "Onbekende stand.";
  }
}
