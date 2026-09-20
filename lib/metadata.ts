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
 * De adressen hier zijn relatief. Ze worden absoluut gemaakt door `metadataBase`
 * in de twee root layouts, en dat is niet vrijblijvend: een relatieve canonical
 * werkt nog wel, maar **relatieve hreflang wordt door Google genegeerd**. Dat is
 * precies het label dat vertelt dat `/agenda` en `/en/agenda` dezelfde pagina in
 * twee talen zijn — de hele reden dat deze site twee echte taalroutes heeft.
 * Haal `metadataBase` dus niet weg.
 *
 * `path` is het pad zonder taalvoorvoegsel, net als bij SiteHeader.
 */

/** De publieke pagina's, zonder taalvoorvoegsel. Ook de bron voor de sitemap. */
export const PUBLIC_PATHS = [
  "/",
  "/agenda",
  "/band",
  "/muziek",
  "/video",
  "/fotos",
  "/boeken",
] as const;

/**
 * De afbeelding onder een gedeelde link.
 *
 * Gemaakt met scripts/gen-social-images.mjs: de achtergrond van de hero met
 * hetzelfde leesbaarheidsverloop en het wordmark erop. Eén afbeelding voor de
 * hele site en niet een per pagina — een aankondiging van een optreden wordt
 * gedeeld omdat het over de band gaat, niet omdat het over /agenda gaat.
 */
const OG_IMAGE = {
  url: "/assets/og.jpg",
  width: 1200,
  height: 630,
  alt: "Static Line",
} as const;

/** De taalcodes zoals Open Graph ze wil: met een streepje en een land erbij. */
const OG_LOCALES: Record<Locale, string> = { nl: "nl_NL", en: "en_GB" };

export function pageMetadata(
  locale: Locale,
  path: string,
  title?: string,
): Metadata {
  const copy = getCopy(locale);
  const url = localePath(locale, path);

  return {
    title,
    description: copy.meta.description,
    alternates: {
      canonical: url,
      languages: {
        nl: localePath("nl", path),
        en: localePath("en", path),
      },
    },
    /**
     * Wat WhatsApp, Facebook en Instagram laten zien.
     *
     * Titel en omschrijving staan er bewust niet in: Next vult die aan uit
     * `title` en `description` hierboven, inclusief de sjabloon uit de layout.
     * Ze hier herhalen zou betekenen dat "%s — Static Line" op twee plekken
     * staat, en dan lopen de twee titels vroeg of laat uiteen.
     */
    openGraph: {
      type: "website",
      url,
      siteName: copy.meta.title,
      locale: OG_LOCALES[locale],
      alternateLocale: OG_LOCALES[locale === "nl" ? "en" : "nl"],
      images: [OG_IMAGE],
    },
    // Een grote kaart en geen kleine: er staat een afbeelding onder, en een
    // postzegel ernaast doet die tekort.
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  };
}
