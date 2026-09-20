/**
 * De teksten van de site als platte lijst met puntpaden.
 *
 * Het beheerscherm had een handgeschreven lijst van drie sleutels. Elke tekst
 * die je daar bij wilde hebben, was een commit — en de site bestaat uit ruim
 * honderd teksten. Nu komt de lijst uit content/nl.ts zelf: wat daar staat, is
 * aan te passen. Komt er een tekst bij, dan staat hij er vanzelf bij.
 *
 * Het pad is de sleutel: `agenda.intro`, `booking.fields.budget`. Dat is precies
 * wat er al in de database stond voor de drie oude sleutels (`hero.sub`,
 * `hero.subShort`, `footer.note`), dus er hoeft niets omgezet te worden.
 *
 * Zonder imports en zonder `server-only`, zodat `npm test` dit kan draaien.
 */

/** Groepen die niet aan te passen zijn, met de reden erbij. */
export const SKIPPED: Record<string, string> = {
  // Staat in de `metadata`-export van de root layout, en die wordt bij het
  // bouwen vastgelegd. Er een databaseaanroep in zetten zou elke pagina van de
  // site dynamisch maken — een flinke prijs voor twee regels die één keer per
  // jaar veranderen.
  meta: "Wordt bij het bouwen vastgelegd; past in content/nl.ts",
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Alle tekstwaarden met hun pad.
 *
 * Lijsten worden overgeslagen. De enige die er is — `photos.placeholders` —
 * bestaat om weg te gaan zodra er echte foto's zijn, en die beheer je in het
 * fotoblok en niet als vijf losse tekstvelden.
 */
export function flattenCopy(
  value: unknown,
  prefix = "",
): { path: string; text: string }[] {
  if (!isPlainObject(value)) return [];

  const out: { path: string; text: string }[] = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!prefix && key in SKIPPED) continue;

    if (typeof child === "string") out.push({ path, text: child });
    else if (isPlainObject(child)) out.push(...flattenCopy(child, path));
  }
  return out;
}

/** De tekst op een puntpad, of `undefined`. */
export function getPath(source: unknown, path: string): string | undefined {
  let current: unknown = source;
  for (const part of path.split(".")) {
    if (!isPlainObject(current)) return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * De teksten uit de database over die uit de code heen leggen.
 *
 * Maakt een nieuwe structuur; het origineel blijft ongemoeid. Dat is niet
 * netheid maar noodzaak: `content/nl.ts` is één object dat bij het bouwen wordt
 * geladen en door elk verzoek gedeeld wordt. Het ter plekke aanpassen zou
 * betekenen dat de tekst van de ene bezoeker bij de volgende blijft staan.
 *
 * Een lege waarde telt niet als wijziging. Zo kan een leeggemaakt veld in het
 * beheer nooit een pagina leeg maken — het valt terug op wat er in de code
 * staat. Datzelfde uitgangspunt staat bovenaan lib/site-content.ts.
 */
export function applyOverrides<T>(base: T, overrides: Record<string, string>): T {
  const entries = Object.entries(overrides).filter(([, text]) => text.trim() !== "");
  if (entries.length === 0) return base;

  const copy = structuredClone(base) as unknown;

  for (const [path, text] of entries) {
    const parts = path.split(".");
    const leaf = parts.pop();
    if (!leaf) continue;

    let target: unknown = copy;
    for (const part of parts) {
      if (!isPlainObject(target)) break;
      target = target[part];
    }

    // Alleen bestaande teksten overschrijven. Een pad dat er niet meer is —
    // een tekst die uit de code verdween nadat iemand hem hier had aangepast —
    // hoort geen nieuw veld aan te maken dat nergens getoond wordt.
    if (isPlainObject(target) && typeof target[leaf] === "string") {
      target[leaf] = text;
    }
  }

  return copy as T;
}
