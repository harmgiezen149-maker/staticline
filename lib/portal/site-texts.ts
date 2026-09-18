import { storageKey } from "./content-keys.ts";
import { hashSource } from "./translation-keys.ts";

/**
 * De teksten die de site zelf bezit, en hun Engelse versie.
 *
 * Anders dan de teksten uit de Band App staan deze allebei in dezelfde tabel en
 * in hetzelfde formulier — Nederlands en Engels onder elkaar op één scherm. Wat
 * er niet staat, komt uit content/nl.ts en content/en.ts.
 *
 * Daarom werkt verouderen hier anders. Bij de Band App-teksten valt de site terug
 * op het Nederlands zodra het origineel gewijzigd is: de beheerder ziet die
 * teksten niet naast elkaar en zou het verschil nooit opmerken. Hier wél, dus
 * volstaat een melding en blijft de Engelse pagina Engels. Stil van taal wisselen
 * op een gepubliceerde pagina is erger dan een waarschuwing die je ziet staan.
 *
 * De tekst uit de code komt hier als argument binnen in plaats van uit een import
 * van content/. Zo blijft deze module te draaien op kale Node en dus te testen —
 * zie lib/portal/copy-text.ts.
 */

/** De sleutel waaronder de bronhash van een sitetekst staat. */
export const siteHashKey = (key: string) => `trsrc:site.${key}`;

/** De Nederlandse tekst die geldt: uit de database, anders uit de code. */
export function dutchText(
  key: string,
  content: Record<string, string>,
  codeFallback: string,
): string {
  return (content[storageKey(key, "nl")] ?? "").trim() || codeFallback;
}

/**
 * Of de Engelse versie nog bij de huidige Nederlandse tekst hoort.
 *
 * Zonder bewaarde bronhash is deze tekst met de hand ingevuld en nooit vertaald.
 * Dan valt er niets te verouderen — iemand die zelf twee talen intikt, weet wat
 * hij doet.
 */
export function siteTextStale(
  key: string,
  content: Record<string, string>,
  codeFallback: string,
): boolean {
  const english = (content[storageKey(key, "en")] ?? "").trim();
  if (!english) return false;

  const stored = content[storageKey(siteHashKey(key))] ?? "";
  if (!stored) return false;

  return stored !== hashSource(dutchText(key, content, codeFallback));
}
