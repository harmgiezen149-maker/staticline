import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * De gedeelde sleutel waarmee de Band App zich hier meldt.
 *
 * Dezelfde sleutel als de site gebruikt om zich bij de Band App te melden —
 * `/api/site` daar controleert hem op precies dezelfde manier. Twee partijen,
 * één geheim, allebei de kanten op.
 *
 * Stond eerst twee keer uitgeschreven, in /api/tov hier en in /api/site daar.
 * Nu er een derde route bijkomt (/api/abonnees) is dat er één te veel: een
 * controle die tussen de buitenwereld en de gegevens van de band staat, hoort
 * op één plek te staan en niet drie keer overgetypt te worden.
 */

/** Korter dan dit is een raadbare sleutel; zie ook MIN_SECRET_LENGTH in seal.ts. */
const MIN_LENGTH = 32;

/** Of de koppeling ingesteld is. Zonder sleutel bestaan deze routes niet. */
export function tokenConfigured(): boolean {
  return (process.env.SITE_API_TOKEN?.trim().length ?? 0) >= MIN_LENGTH;
}

/**
 * Of dit verzoek de juiste sleutel meebrengt.
 *
 * `false` zolang SITE_API_TOKEN niet staat. Een route die gegevens van de band
 * teruggeeft of betaalde aanroepen doet, hoort niet open te staan omdat iemand
 * vergeten is een waarde in te vullen.
 *
 * De vergelijking gaat via `timingSafeEqual`. Een gewone `===` stopt bij het
 * eerste verschillende teken, en uit hoe lang dat duurt is af te leiden hoeveel
 * tekens klopten.
 */
export function authorized(request: Request): boolean {
  const secret = process.env.SITE_API_TOKEN;
  if (!secret || secret.length < MIN_LENGTH) return false;

  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  // timingSafeEqual gooit op ongelijke lengtes, dus die eerst.
  return a.length === b.length && timingSafeEqual(a, b);
}
