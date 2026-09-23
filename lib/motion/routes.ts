/**
 * Welke klik een paginaovergang krijgt, en welk kanaal er in beeld komt.
 *
 * Los van de rest van de motion-laag en zonder imports, zodat `npm test` het kan
 * nalopen. Dit is precies het soort regel dat stil fout gaat: een overgang op
 * een mailto-link, of op een link naar /beheer die een andere root layout
 * heeft en dus toch een volledige lading wordt.
 */

export type Locale = "nl" | "en";

/** Het taalvoorvoegsel van een pad, zoals lib/i18n.ts het schrijft. */
export function localeOfPath(path: string): Locale {
  return path === "/en" || path.startsWith("/en/") ? "en" : "nl";
}

/** Het pad zonder taalvoorvoegsel: "/en/agenda" wordt "/agenda", "/en" wordt "/". */
export function stripLocale(path: string): string {
  if (path === "/en") return "/";
  if (path.startsWith("/en/")) return path.slice(3);
  return path;
}

export type LinkKind =
  /** Andere pagina in dezelfde taal: banden dicht, wisselen, banden open. */
  | "band"
  /** Dezelfde pagina in de andere taal. Wordt een volledige lading, zie lang.ts. */
  | "lang"
  /** Iets waar de overgang niets mee te maken heeft. */
  | "none";

type LinkInput = {
  /** Het volledige adres uit de link, na oplossen tegen de huidige pagina. */
  href: string;
  /** Het adres van de huidige pagina. */
  current: string;
  target?: string | null;
  download?: boolean;
  /** Met Ctrl, Cmd, Shift of Alt, of een andere muisknop dan de linker. */
  modified?: boolean;
};

/**
 * Wat voor klik dit is.
 *
 * Geen overgang bij: een andere site, mailto en tel, een nieuw tabblad, een
 * download, een klik met een modifier, een anker op dezelfde pagina, het
 * besloten deel (andere root layout), de API en bestanden met een extensie.
 */
export function classifyLink({ href, current, target, download, modified }: LinkInput): LinkKind {
  if (modified || download) return "none";
  if (target && target !== "_self") return "none";

  let to: URL;
  let from: URL;
  try {
    from = new URL(current);
    to = new URL(href, from);
  } catch {
    return "none";
  }

  if (to.origin !== from.origin) return "none";
  if (to.protocol !== "http:" && to.protocol !== "https:") return "none";

  const path = to.pathname;
  if (path === "/beheer" || path.startsWith("/beheer/")) return "none";
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return "none";
  // Een bestand: /assets/og.jpg, /sitemap.xml.
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return "none";

  // Dezelfde pagina, met een ander anker of een andere zoekopdracht: gewoon
  // scrollen of verversen. Een overgang zou hier nooit meer opengaan, want er
  // komt geen nieuwe pagina om op te wachten.
  if (path === from.pathname) return "none";

  const fromLocale = localeOfPath(from.pathname);
  const toLocale = localeOfPath(path);
  if (fromLocale !== toLocale) {
    // Dezelfde pagina in de andere taal is de taalwissel; een andere pagina in
    // de andere taal komt niet voor in de navigatie en krijgt niets.
    return stripLocale(path) === stripLocale(from.pathname) ? "lang" : "none";
  }

  return "band";
}

/**
 * Het label midden in beeld tijdens een overgang: "CH 02 · SHOWS".
 *
 * Elk onderdeel van de site is een kanaal, in de volgorde van de navigatie. De
 * naam komt van de aanroeper (uit de copy), zodat hij in beide talen klopt.
 */
const CHANNELS = ["/", "/agenda", "/fotos", "/band", "/muziek", "/video", "/boeken"];

export function channelFor(path: string): number {
  const bare = stripLocale(path);
  const index = CHANNELS.findIndex(
    (channel) => channel === bare || (channel !== "/" && bare.startsWith(`${channel}/`)),
  );
  return index === -1 ? CHANNELS.length + 1 : index + 1;
}

export function channelLabel(path: string, name: string): string {
  return `CH ${String(channelFor(path)).padStart(2, "0")} · ${name}`;
}
