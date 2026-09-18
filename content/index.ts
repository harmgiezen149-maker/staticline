import type { Locale } from "@/lib/i18n";
import type { Copy } from "./types";
import { nl } from "./nl";
import { en } from "./en";

const dictionaries: Record<Locale, Copy> = { nl, en };

/**
 * De copy voor één taal.
 *
 * Synchroon en niet via `import()`: beide talen samen zijn een paar kilobyte, en
 * dit draait op de server — het bespaart de bezoeker niets om er een asynchrone
 * laag omheen te zetten, en het maakt elke aanroeper async.
 */
export function getCopy(locale: Locale): Copy {
  return dictionaries[locale];
}

export type { Copy };
