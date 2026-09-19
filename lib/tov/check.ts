/**
 * Wat er in code te controleren valt aan een geschreven tekst.
 *
 * Dit is het deel dat niet van een oordeel afhangt. Een model kan zeggen dat het
 * de feiten heeft laten staan; deze functies rékenen na of dat zo is. Links,
 * mentions, hashtags en tijden worden letterlijk vergeleken, het aantal woorden
 * wordt geteld, en de verboden woorden worden opgezocht.
 *
 * Twee kanten op, en dat is het verschil met de eerste versie. Wat uit de bron
 * verdwenen is én wat er niet in stond en toch in de tekst staat — zie
 * `findInvented` voor waarom dat tweede er pas bij kwam toen de module ook
 * zonder brontekst ging schrijven.
 *
 * Zonder imports en zonder `server-only`, zodat `npm test` het kan draaien. Zie
 * lib/tov/write.ts voor het deel dat het model aanroept.
 */

export type FlagType =
  | "unclear"
  | "missing_info"
  | "too_long"
  | "suspicious_input"
  | "invented"
  | "no_source"
  | "check_failed";

export type Flag = { type: FlagType; message: string };

/** Wat er letterlijk gelijk moet blijven tussen invoer en uitvoer. */
export type Tokens = {
  links: string[];
  mentions: string[];
  hashtags: string[];
  times: string[];
  numbers: string[];
};

const LINK = /https?:\/\/[^\s<>"')\]]+/g;
const MENTION = /@[A-Za-z0-9._-]{2,}/g;
const HASHTAG = /#[\p{L}\p{N}_]+/gu;
// 20:00 en 20.00, maar niet 2026 of 1.5. Uren 0–23, minuten 00–59.
const TIME = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g;

const uniek = (waarden: string[]) => [...new Set(waarden)];

/**
 * De vaste onderdelen uit een tekst halen.
 *
 * Tijden worden genormaliseerd naar `20:00`, zodat "20.00" in de invoer en
 * "20:00" in de uitvoer niet als verschil telt — dat is notatie, geen feit.
 *
 * Getallen worden pas gezocht nadat links en tijden eruit zijn. Anders telt het
 * jaartal in een URL mee, en de 20 en 00 uit een tijd apart.
 */
export function extractTokens(text: string): Tokens {
  const links = uniek(text.match(LINK) ?? []);

  let rest = text;
  for (const link of links) rest = rest.split(link).join(" ");

  const times = uniek(
    [...rest.matchAll(TIME)].map(([, uur, minuut]) => `${uur.padStart(2, "0")}:${minuut}`),
  );
  rest = rest.replace(TIME, " ");

  return {
    links,
    mentions: uniek(rest.match(MENTION) ?? []),
    hashtags: uniek(rest.match(HASHTAG) ?? []),
    times,
    // Losse getallen: huisnummers, prijzen, jaartallen, dagen van de maand.
    numbers: uniek((rest.match(/\b\d+(?:[.,]\d+)?\b/g) ?? []).map((n) => n.replace(",", "."))),
  };
}

/** Woorden tellen zoals een mens ze telt. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Verboden woorden zoeken.
 *
 * Op woordgrens en hoofdletterongevoelig, zodat "Unieke" ook gevonden wordt en
 * "uniek" niet aanslaat op "uniekheid"… wat geen woord is, maar het idee klopt:
 * een treffer middenin een langer woord is meestal geen treffer.
 */
export function findBlocked(text: string, blocklist: string[]): string[] {
  const laag = text.toLowerCase();
  return blocklist.filter((woord) => {
    const naald = woord.toLowerCase();
    const index = laag.indexOf(naald);
    if (index === -1) return false;

    const ervoor = laag[index - 1] ?? " ";
    const erna = laag[index + naald.length] ?? " ";
    return !/[\p{L}\p{N}]/u.test(ervoor) && !/[\p{L}\p{N}]/u.test(erna);
  });
}

/** Een gedachtestreepje leest snel als AI; zie de tone of voice. */
export const hasEmDash = (text: string) => /[—–]/.test(text);

/**
 * Feiten die erbij verzonnen zijn.
 *
 * De controle hierboven kijkt maar één kant op: staat er iets uit de bron niet
 * meer in de tekst. Dat was genoeg zolang er alleen herschreven werd — een model
 * met een brontekst verzint zelden een tijdstip erbij.
 *
 * Bij schrijven vanaf een onderwerp draait dat om. Vraag om een aankondiging en
 * het model wil een aanvangstijd; heeft het die niet, dan vult het er een in. De
 * tone of voice verbiedt dat, maar een instructie is geen controle.
 *
 * Wat hard gecontroleerd wordt en wat alleen een vlag geeft, is een afweging
 * tussen vals alarm en gemiste fouten:
 *
 * - **Links, tijden en mentions**: hard. Een link of een @-account dat niet in de
 *   bron staat is altijd fout — het model kán de echte niet kennen. Hetzelfde
 *   voor een tijdstip: dat is het geval waarvoor deze controle bestaat.
 * - **Getallen**: alleen een vlag. Een jaartal in een zin, een huisnummer, "vier
 *   leden" als cijfer — te veel daarvan is onschuldig om er een fout van te maken.
 * - **Hashtags**: niet gecontroleerd. Een social post hóórt hashtags te krijgen
 *   die niet in de bron staan; dat staat zo in de opbouw van dat teksttype.
 */
export function findInvented(bron: Tokens, doel: Tokens) {
  const erbij = (bronnen: string[], doelen: string[]) =>
    doelen.filter((waarde) => !bronnen.includes(waarde));

  return {
    links: erbij(bron.links, doel.links),
    times: erbij(bron.times, doel.times),
    mentions: erbij(bron.mentions, doel.mentions),
    numbers: erbij(bron.numbers, doel.numbers),
  };
}

export type CheckInput = {
  /**
   * Waar de feiten vandaan komen. Bij herschrijven is dat de aangeleverde
   * tekst, bij schrijven het feitenblad uit lib/tov/factsheet.ts. In beide
   * gevallen geldt dezelfde regel: wat hier niet in staat, hoort niet in de
   * uitvoer te staan.
   */
  source: string;
  output: string;
  maxWords: number;
  blocklist: string[];
};

export type CheckResult = {
  /** Wat er mis is, in gewone taal, om aan het model terug te geven. */
  problems: string[];
  /** Wat de gebruiker te zien krijgt. */
  flags: Flag[];
  wordCount: number;
};

/**
 * De hele controle in één keer.
 *
 * `problems` gaat naar het model voor de ene herziening. `flags` gaat naar het
 * scherm. Het verschil is opzet: "je gebruikte het woord unieke" is bruikbaar
 * voor een herschrijving, "er ontbrak een starttijd in de bron" is iets wat de
 * gebruiker moet weten en het model niet kan oplossen.
 */
export function checkOutput({
  source,
  output,
  maxWords,
  blocklist,
}: CheckInput): CheckResult {
  const problems: string[] = [];
  const flags: Flag[] = [];

  const bron = extractTokens(source);
  const doel = extractTokens(output);

  const ontbreekt = (wat: string, bronnen: string[], doelen: string[]) => {
    const kwijt = bronnen.filter((waarde) => !doelen.includes(waarde));
    if (kwijt.length > 0) {
      problems.push(`Deze ${wat} uit de bron staan niet meer in de tekst: ${kwijt.join(", ")}. Zet ze er ongewijzigd in.`);
    }
    return kwijt;
  };

  ontbreekt("links", bron.links, doel.links);
  ontbreekt("mentions", bron.mentions, doel.mentions);
  ontbreekt("hashtags", bron.hashtags, doel.hashtags);
  ontbreekt("tijden", bron.times, doel.times);

  const getallenKwijt = bron.numbers.filter((n) => !doel.numbers.includes(n));
  if (getallenKwijt.length > 0) {
    flags.push({
      type: "missing_info",
      message: `Deze getallen uit de bron staan niet in de tekst: ${getallenKwijt.join(", ")}. Controleer of dat klopt.`,
    });
  }

  // Het omgekeerde: wat er niet in de bron stond en toch in de tekst staat.
  const verzonnen = findInvented(bron, doel);

  const erbij = (wat: string, waarden: string[]) => {
    if (waarden.length === 0) return;
    problems.push(
      `Deze ${wat} staan niet in de bron en zijn er dus bij verzonnen: ${waarden.join(", ")}. Haal ze weg.`,
    );
    flags.push({
      type: "invented",
      message: `Er stonden ${wat} in de tekst die nergens uit de bron komen: ${waarden.join(", ")}.`,
    });
  };

  erbij("links", verzonnen.links);
  erbij("tijden", verzonnen.times);
  erbij("mentions", verzonnen.mentions);

  if (verzonnen.numbers.length > 0) {
    flags.push({
      type: "missing_info",
      message: `Deze getallen staan niet in de bron: ${verzonnen.numbers.join(", ")}. Controleer ze voor je de tekst gebruikt.`,
    });
  }

  const wordCount = countWords(output);
  if (wordCount > maxWords) {
    problems.push(`De tekst is ${wordCount} woorden; de limiet is ${maxWords}. Kort in zonder een feit weg te laten.`);
    flags.push({
      type: "too_long",
      message: `De tekst bleef op ${wordCount} woorden staan, boven de limiet van ${maxWords}.`,
    });
  }

  const verboden = findBlocked(output, blocklist);
  if (verboden.length > 0) {
    problems.push(`Deze woorden mogen niet: ${verboden.join(", ")}. Herschrijf die zinnen.`);
  }

  if (hasEmDash(output)) {
    problems.push("Er staat een gedachtestreepje in. Gebruik een punt of een komma.");
  }

  return { problems, flags, wordCount };
}
