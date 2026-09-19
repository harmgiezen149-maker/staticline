"use server";

import { log } from "@/lib/portal/audit";
import { getSession } from "@/lib/portal/session";
import { makeLimiter } from "@/lib/rate-limit";
import { MAX_INPUT_CHARS, textTypeById } from "@/lib/tov/config";
import { type Flag } from "@/lib/tov/check";
import { rewrite } from "@/lib/tov/rewrite";

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
  failed: "Het herschrijven lukte niet. De logs van Vercel zeggen wat er misging.",
  shape:
    "Er kwam een onverwacht antwoord terug. Er is niets getoond — een halve tekst is erger dan geen tekst.",
};

/**
 * Een tekst herschrijven naar de tone of voice.
 *
 * Open voor elk bandlid, niet alleen de beheerder: de band schrijft zijn eigen
 * social posts, en een module die daarvoor langs één persoon moet, wordt niet
 * gebruikt.
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

  const input = String(formData.get("text") ?? "").trim();
  const typeId = String(formData.get("textType") ?? "");
  const context = String(formData.get("context") ?? "").trim().slice(0, 1000);

  if (!input) return { ok: false, message: "Plak eerst een tekst." };
  if (input.length > MAX_INPUT_CHARS) {
    return {
      ok: false,
      message: `De tekst is ${input.length} tekens; het maximum is ${MAX_INPUT_CHARS}.`,
    };
  }

  const type = textTypeById(typeId);
  if (!type) return { ok: false, message: "Kies een teksttype." };

  const result = await rewrite({ input, type, context });
  if (!result.ok) {
    return { ok: false, message: REDENEN[result.error] ?? "Herschrijven mislukt." };
  }

  // Geen teksten in het logboek: daar kunnen namen en adressen in staan, en de
  // module is een hulpmiddel en geen archief.
  await log({
    actor: session.email,
    action: "tov.rewrite",
    subject: type.id,
    detail: `tone of voice ${result.version}, ${result.nl.wordCount}/${result.en.wordCount} woorden`,
  });

  return { ok: true, nl: result.nl, en: result.en, flags: result.flags };
}
