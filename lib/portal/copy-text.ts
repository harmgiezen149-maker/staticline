import { getCopy } from "@/content";

import type { Locale } from "@/lib/i18n";

/**
 * De tekst zoals die in content/nl.ts en content/en.ts staat.
 *
 * Apart van site-texts.ts, dat de logica eromheen bevat en getest wordt. Die
 * module raakt content/ daarom niet aan: `npm test` draait op kale Node, en dat
 * kan de `@/`-aliassen en de importregels zonder extensie in die map niet
 * oplossen. Dezelfde reden dat lib/events.js in de Band App gesplitst is.
 */
export function codeText(key: string, locale: Locale): string {
  const copy = getCopy(locale) as unknown as Record<
    string,
    Record<string, string>
  >;
  const [group, name] = key.split(".");
  return copy[group]?.[name] ?? "";
}
