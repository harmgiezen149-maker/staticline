// Taal en datumnotatie. Twee talen, via routing: Nederlands op `/`, Engels op
// `/en`. Niet als clientstate — het prototype bewaarde de keuze in localStorage,
// dat was prototypegemak en hoort hier niet.

export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "nl";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Het pad waar een pagina in een bepaalde taal staat.
 *
 * Nederlands is de standaardtaal en staat daarom zonder voorvoegsel: `/agenda`,
 * niet `/nl/agenda`. Engels krijgt `/en` ervoor. `proxy.ts` vertaalt dat terug
 * naar de `[lang]`-map, zodat er maar één set pagina's is.
 */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return locale === defaultLocale ? clean || "/" : `/en${clean}`;
}

/**
 * De tijdzone waarin agenda-items van de Band App gelezen moeten worden.
 *
 * De Band App bewaart de kloktijd van de band als UTC-onderdelen (zie
 * lib/eventdates.js daar): 20:00 wordt weggeschreven als 20:00 UTC en is bedoeld
 * als 20:00 op de klok in de zaal, het hele jaar door, zonder zomertijd. Wie hier
 * naar Europe/Amsterdam zou omrekenen, zet elke show een uur verkeerd — en dat
 * ziet er net geloofwaardig genoeg uit om niet op te vallen.
 *
 * docs/04-band-app-integration.md noemt twee applicaties die datums verschillend
 * formatteren als een bug die de band gaat zien. Dit is die bug, en dit is waarom
 * hij hier niet zit.
 */
const SHOW_TIME_ZONE = "UTC";

const DATE_LOCALES: Record<Locale, string> = {
  nl: "nl-NL",
  en: "en-GB",
};

/** "10 nov 2026" in het Nederlands, "10 Nov 2026" in het Engels. */
export function formatShowDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: SHOW_TIME_ZONE,
  })
    .format(new Date(iso))
    .replace(/\.$/, "");
}

/** "10 november 2026" — voluit, voor de kicker in de hero. */
export function formatShowDateLong(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SHOW_TIME_ZONE,
  }).format(new Date(iso));
}

/** "10.11" — dag en maand als cijfers, voor het datumblok in de volgende-show-balk. */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

/** "10.11.26" — de compacte variant die het ontwerp op mobiel toont. */
export function formatDayMonthYear(iso: string): string {
  const year = String(new Date(iso).getUTCFullYear()).slice(-2);
  return `${formatDayMonth(iso)}.${year}`;
}

/** "20:30" */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Het jaartal, los, voor de metaregel onder het datumblok. */
export function formatYear(iso: string): string {
  return String(new Date(iso).getUTCFullYear());
}
