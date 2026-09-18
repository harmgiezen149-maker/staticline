import type { Metadata } from "next";

import { getCopy } from "@/content";
import { localePath, type Locale } from "./i18n";

/**
 * De metadata van één pagina.
 *
 * Elke pagina zet zijn eigen canonieke adres en zijn eigen `hreflang`-paar. Zonder
 * dit erft elke pagina de canonical van de root layout — dan zegt /boeken tegen
 * een zoekmachine dat hij eigenlijk de homepage is, en verdwijnt hij uit de
 * resultaten. Precies de pagina waar de site het om doet.
 *
 * `path` is het pad zonder taalvoorvoegsel, net als bij SiteHeader.
 */
export function pageMetadata(
  locale: Locale,
  path: string,
  title?: string,
): Metadata {
  const copy = getCopy(locale);

  return {
    title,
    description: copy.meta.description,
    alternates: {
      canonical: localePath(locale, path),
      languages: {
        nl: localePath("nl", path),
        en: localePath("en", path),
      },
    },
  };
}
