import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import raw from "@/content/tov-config.json";

import type { SourceKey } from "./factsheet";

import { loadContent } from "@/lib/portal/content";
import { storageKey } from "@/lib/portal/content-keys";

/**
 * De instellingen van de herschrijfmodule.
 *
 * Drie dingen staan los van de code: de tone of voice zelf
 * (`content/tone-of-voice.md`), de lengtelimieten en de verboden woorden
 * (`content/tov-config.json`). Zo is de toon bij te stellen zonder dat er iemand
 * aan de module hoeft te komen.
 *
 * De limieten en de blocklist komen als gewone import binnen; Next bundelt JSON
 * mee en daar hoeft niets voor getraceerd te worden. De tone of voice is een
 * markdownbestand en wordt van schijf gelezen — dat staat daarom in
 * `outputFileTracingIncludes` in next.config.ts, net als db/schema.sql. Haal dat
 * daar niet weg.
 *
 * Daarbovenop dezelfde laag als de rest van de site: staat er een versie in de
 * database, dan wint die. Zo is de toon ook zonder commit bij te stellen, en
 * blijft het bestand de versie waar je op terugvalt.
 */

/** Waar de tekst over gaat, en dus welke kiezer erbij hoort. */
export type SubjectKind = "none" | "member" | "gig" | "past_gig";

export type TextType = {
  id: string;
  label: string;
  maxWords: number;
  maxWordsLong?: number;
  perspective: string;
  hint: string;
  /** Welke bronnen standaard aanstaan in de schrijfstand. */
  sources: SourceKey[];
  subject: SubjectKind;
};

/** Feiten over de band die niet uit de Band App komen. Zie tov-config.json. */
export const BAND_FACTS = raw.band as { name: string; city: string };

export const TEXT_TYPES = raw.textTypes as TextType[];
export const MAX_INPUT_CHARS = raw.maxInputChars;
/** De opdracht is kort van nature; een lange opdracht is meestal een brontekst. */
export const MAX_BRIEF_CHARS = raw.maxBriefChars;
export const BLOCKLIST = raw.blocklist as { nl: string[]; en: string[] };

/** De sleutel waaronder een eigen tone of voice in de database staat. */
export const TOV_KEY = "tov.prompt";

export function textTypeById(id: string): TextType | null {
  return TEXT_TYPES.find((type) => type.id === id) ?? null;
}

/**
 * Hoeveel woorden dit teksttype mag zijn.
 *
 * Bij een bio hangt dat af van hoe lang de invoer is. Het document kent daar een
 * knop voor; die is er niet, omdat wie een bio van twintig woorden aanlevert
 * geen lange bio bedoelt en wie er tweehonderd plakt geen korte. Honderdtwintig
 * woorden is de grens.
 */
export function maxWordsFor(
  type: TextType,
  inputWords: number,
  long?: boolean,
): number {
  if (!type.maxWordsLong) return type.maxWords;
  // In de schrijfstand zegt de lengte van de opdracht niets over de lengte van
  // de tekst — "schrijf een bio" is vier woorden. Daar staat daarom een knopje
  // kort/lang, en die keuze gaat hier vóór de meting.
  if (typeof long === "boolean") return long ? type.maxWordsLong : type.maxWords;
  return inputWords > 120 ? type.maxWordsLong : type.maxWords;
}

function fromFile(): string {
  try {
    return readFileSync(join(process.cwd(), "content", "tone-of-voice.md"), "utf8");
  } catch (error) {
    console.error("[tov] tone-of-voice.md niet gevonden:", error);
    return "";
  }
}

/** Het versienummer uit de tekst, voor het logboek. */
export function versionOf(prompt: string): string {
  return prompt.match(/^VERSIE:\s*(.+)$/m)?.[1]?.trim() ?? "onbekend";
}

export type ToneOfVoice = { prompt: string; version: string; source: "database" | "bestand" };

export async function loadToneOfVoice(): Promise<ToneOfVoice | null> {
  const content = await loadContent().catch(() => ({}) as Record<string, string>);
  const uitDatabase = content[storageKey(TOV_KEY)]?.trim();

  const prompt = uitDatabase || fromFile();
  if (!prompt.trim()) return null;

  return {
    prompt,
    version: versionOf(prompt),
    source: uitDatabase ? "database" : "bestand",
  };
}
