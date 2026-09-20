import { getCopy } from "@/content";

import { getPath } from "@/lib/copy-paths";
import type { Locale } from "@/lib/i18n";

/**
 * De tekst zoals die in content/nl.ts en content/en.ts staat.
 *
 * Apart van site-texts.ts, dat de logica eromheen bevat en getest wordt. Die
 * module raakt content/ daarom niet aan: `npm test` draait op kale Node, en dat
 * kan de `@/`-aliassen en de importregels zonder extensie in die map niet
 * oplossen. Dezelfde reden dat lib/events.js in de Band App gesplitst is.
 *
 * De sleutel is een puntpad, en dat mag zo diep zijn als de copy zelf. Dit liep
 * eerst op twee niveaus vast; sinds alle teksten aan te passen zijn, bestaan er
 * sleutels als `booking.fields.roomSize`.
 */
export function codeText(key: string, locale: Locale): string {
  return getPath(getCopy(locale), key) ?? "";
}
