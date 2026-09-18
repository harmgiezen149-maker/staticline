import { createHash } from "node:crypto";

import type { BandAppPublic } from "@/lib/band-app";

/**
 * De Engelse vertalingen van teksten die uit de Band App komen.
 *
 * Zonder `server-only`, zodat het te testen is — dezelfde splitsing als bij
 * seal.ts en mail-html.ts. Het lezen uit de database staat in translations.ts.
 *
 * Die app kent één taal. De bandbio, de tekst en rol per lid en de regel onder
 * een show staan daar in het Nederlands, en op /en zag de bezoeker dus Nederlands.
 *
 * De vertaling staat in de database van de wébsite en niet in die van de Band
 * App. Twee redenen: de band leest in de app geen Engels, dus daar heeft het veld
 * geen functie — en een kolom erbij in dat schema betekent `prisma db push` op
 * twee productiedatabases voor iets wat alleen deze site toont. Dit is
 * pagina-inhoud, en die hoort hier.
 *
 * De prijs van die keuze is dat een vertaling stil kan verouderen als iemand de
 * Nederlandse tekst in de app aanpast. Daarom wordt de brontekst mee gehasht:
 * verandert het origineel, dan ziet het beheerscherm dat en valt de site terug op
 * het Nederlands. Liever een Nederlandse zin op een Engelse pagina dan een
 * Engelse zin die iets anders beweert dan het origineel.
 */

/** Eén te vertalen tekst. */
export type Translatable = {
  /** Stabiele sleutel, bijvoorbeeld "band.bio" of "member.3.bio". */
  id: string;
  /** Waar het op de site staat. */
  label: string;
  /** De Nederlandse tekst uit de Band App. */
  source: string;
};

export type Stored = {
  text: string;
  /** De hash van de Nederlandse tekst waarop deze vertaling gemaakt is. */
  sourceHash: string;
};

export type Status = "missing" | "current" | "stale";

/** Kort maar ruim voldoende om een gewijzigde tekst te herkennen. */
export const hashSource = (value: string) =>
  createHash("sha256").update(value.trim()).digest("hex").slice(0, 16);

const textKey = (id: string) => `tr:${id}`;
export const hashKey = (id: string) => `trsrc:${id}`;

/**
 * Wat er te vertalen valt, afgeleid uit wat de Band App teruggeeft.
 *
 * Een vaste lijst zou hier niet werken: leden en shows komen en gaan. Lege
 * bronteksten vallen eruit — er valt niets te vertalen aan een leeg veld.
 *
 * Titels, zaalnamen en plaatsnamen staan er bewust niet bij. "Loburg" en
 * "Wageningen" zijn eigennamen; die horen in beide talen hetzelfde te zijn.
 */
export function collect(data: BandAppPublic | null): Translatable[] {
  if (!data) return [];

  const items: Translatable[] = [];
  const add = (id: string, label: string, source: string) => {
    if (source.trim()) items.push({ id, label, source: source.trim() });
  };

  add("band.bio", "Bandbio", data.band.bio ?? "");

  for (const member of data.members) {
    add(`member.${member.id}.role`, `${member.name} — rol`, member.role ?? "");
    add(
      `member.${member.id}.instrument`,
      `${member.name} — instrument`,
      member.instrument ?? "",
    );
    add(`member.${member.id}.bio`, `${member.name} — tekst`, member.bio ?? "");
  }

  return items;
}

/** De opgeslagen vertalingen, op id. */
export function statusOf(item: Translatable, stored?: Stored): Status {
  if (!stored?.text.trim()) return "missing";
  return stored.sourceHash === hashSource(item.source) ? "current" : "stale";
}

/**
 * De rijen om op te slaan voor één vertaling.
 *
 * Tekst en bronhash gaan altijd samen. Losse opslag zou betekenen dat de ene het
 * wel haalt en de andere niet, en dan staat er een vertaling met een hash die
 * nergens bij hoort.
 */
export function rowsFor(id: string, translation: string, source: string) {
  return [
    { key: textKey(id), locale: "en", value: translation.trim() },
    { key: hashKey(id), locale: "", value: hashSource(source) },
  ];
}

/**
 * De Engelse tekst, of het Nederlands als er geen bruikbare vertaling is.
 *
 * Alleen een vertaling die bij de huidige brontekst hoort telt mee. Is het
 * origineel gewijzigd, dan valt dit terug op het Nederlands tot iemand opnieuw
 * vertaalt — zichtbaar verouderd in het beheerscherm, niet stil verkeerd op de
 * site.
 */
export function pick(
  id: string,
  source: string,
  translations: Record<string, Stored>,
): string {
  const stored = translations[id];
  if (!stored?.text.trim()) return source;
  return stored.sourceHash === hashSource(source) ? stored.text : source;
}
