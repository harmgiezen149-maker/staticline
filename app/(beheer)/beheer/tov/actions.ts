"use server";

import { log } from "@/lib/portal/audit";
import { getSession } from "@/lib/portal/session";
import { makeLimiter } from "@/lib/rate-limit";
import { MAX_BRIEF_CHARS, MAX_INPUT_CHARS, textTypeById } from "@/lib/tov/config";
import { type Flag } from "@/lib/tov/check";
import { parseRequest, reasonFor } from "@/lib/tov/request";
import { runTov } from "@/lib/tov/run";

export type TovState =
  | { ok: true; nl: Uitvoer; en: Uitvoer; flags: Flag[] }
  | { ok: false; message: string }
  | null;

export type Uitvoer = { text: string; changes: string[]; wordCount: number };

/**
 * Twintig herschrijvingen per persoon per uur.
 *
 * Elke aanroep kost geld en duurt even. Dit is ruim voor wie een middag aan
 * teksten zit, en het vangt de hand op de knop. Net als elders in dit project
 * een drempel en geen muur: op Vercel begint elke koude start met een lege
 * teller.
 */
const perPersoon = makeLimiter({ max: 20, windowMs: 60 * 60 * 1000 });

const REDENEN: Record<string, string> = {
  "not-configured":
    "Er is geen ANTHROPIC_API_KEY ingesteld. Zonder die sleutel kan er niet herschreven worden.",
  "no-tov":
    "De tone of voice is niet gevonden. Staat content/tone-of-voice.md er nog?",
  failed: "Het schrijven lukte niet. De logs van Vercel zeggen wat er misging.",
  shape:
    "Er kwam een onverwacht antwoord terug. Er is niets getoond — een halve tekst is erger dan geen tekst.",
};

const LIMITS = { maxInputChars: MAX_INPUT_CHARS, maxBriefChars: MAX_BRIEF_CHARS };

/**
 * Een tekst schrijven of herschrijven in de tone of voice.
 *
 * Open voor elk bandlid, niet alleen de beheerder: de band schrijft zijn eigen
 * social posts, en een module die daarvoor langs één persoon moet, wordt niet
 * gebruikt.
 *
 * Het controleren van de invoer en het uitvoeren staan allebei in lib/tov, zodat
 * dit scherm en de Band App zich precies hetzelfde gedragen. Wat hier overblijft
 * is wie het vraagt, hoe vaak hij dat mag, en wat er in het logboek komt.
 */
export async function herschrijf(
  _previous: TovState,
  formData: FormData,
): Promise<TovState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Je bent uitgelogd." };

  if (!perPersoon(session.email)) {
    return {
      ok: false,
      message: "Je hebt er dit uur al twintig gedaan. Probeer het straks nog eens.",
    };
  }

  const type = textTypeById(String(formData.get("textType") ?? ""));
  if (!type) return { ok: false, message: "Kies een teksttype." };

  const parsed = parseRequest(
    {
      mode: formData.get("mode"),
      text: formData.get("text"),
      brief: formData.get("brief"),
      notes: formData.get("notes"),
      sources: formData.getAll("sources"),
      subjectId: formData.get("subjectId"),
      long: formData.get("long"),
      context: formData.get("context"),
    },
    LIMITS,
  );
  if (!parsed.ok) return { ok: false, message: reasonFor(parsed.error, LIMITS) };

  const result = await runTov(parsed.value, type);
  if (!result.ok) {
    return { ok: false, message: REDENEN[result.error] ?? "Schrijven mislukt." };
  }

  // Geen teksten in het logboek: daar kunnen namen en adressen in staan, en de
  // module is een hulpmiddel en geen archief.
  await log({
    actor: session.email,
    action: parsed.value.mode === "brief" ? "tov.write" : "tov.rewrite",
    subject: type.id,
    detail: `tone of voice ${result.version}, ${result.nl.wordCount}/${result.en.wordCount} woorden`,
  });

  return { ok: true, nl: result.nl, en: result.en, flags: result.flags };
}
