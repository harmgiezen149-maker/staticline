/**
 * Het feitenblad: waar de module zijn feiten vandaan haalt.
 *
 * Dit is het verschil tussen herschrijven en schrijven. Bij herschrijven is de
 * aangeleverde tekst de bron, en rekent `checkOutput` de uitvoer daartegen na.
 * Bij schrijven is er geen brontekst — dan zou het model de feiten moeten
 * leveren, en dat is precies wat het niet mag.
 *
 * Dus stelt deze module een bron samen uit wat er al is: de band, de leden, de
 * agenda, de setlist, de sitetekst, en de aantekeningen van de schrijver. Dat
 * blok gaat naar het model én naar de controle. Alles wat erin staat mag in de
 * tekst; wat er niet in staat is verzonnen.
 *
 * **Alleen aanvinken wat je nodig hebt.** Hoe breder het feitenblad, hoe meer er
 * "waar" is en hoe minder de controle betekent. Stuur je bij een lid-bio ook de
 * hele agenda mee, dan mag het model datums noemen die er niets mee te maken
 * hebben en merkt niemand het. Smalle bronnen zijn een strengere controle.
 *
 * Zonder imports en zonder `server-only`, zodat `npm test` het kan draaien —
 * dezelfde splitsing als bij check.ts en seal.ts. Datums komen er al opgemaakt
 * in: het opmaken gebeurt in lib/tov/sources.ts, met de helpers uit lib/i18n.ts
 * die op UTC formatteren. Doe dat hier niet alsnog met een eigen formatter.
 */

/** Welke bronnen er zijn. De volgorde is die van het feitenblad. */
export const SOURCE_KEYS = [
  "band",
  "members",
  "upcoming",
  "past",
  "setlist",
  "site",
  "socials",
] as const;

export type SourceKey = (typeof SOURCE_KEYS)[number];

export function isSourceKey(value: string): value is SourceKey {
  return (SOURCE_KEYS as readonly string[]).includes(value);
}

/** Hoe elke bron in het scherm heet. */
export const SOURCE_LABELS: Record<SourceKey, string> = {
  band: "Band",
  members: "Leden",
  upcoming: "Agenda, komend",
  past: "Agenda, gespeeld",
  setlist: "Setlist",
  site: "Sitetekst",
  socials: "Socials",
};

/**
 * Eén show, met de datum al opgemaakt.
 *
 * `when` is wat er in het feitenblad komt te staan, bijvoorbeeld
 * "10 november 2026 · 20:00". Die opmaak hoort bij lib/i18n.ts en niet hier;
 * zie de kop van dit bestand.
 */
export type FactShow = {
  id: number;
  when: string;
  venue: string;
  city: string;
  status: string;
  ticketUrl?: string | null;
  note?: string;
};

export type FactMember = {
  id: number;
  name: string;
  role?: string;
  instrument?: string;
  bio?: string;
};

/** Eén regel in een keuzelijst: een lid of een show. */
export type Pick = { id: number; label: string };

/**
 * Wat een scherm nodig heeft om zijn kiezers te vullen.
 *
 * Staat hier en niet in sources.ts omdat dat bestand `server-only` is: een
 * clientcomponent die er een type uit importeert, trekt in de praktijk zo de
 * databasedriver de browserbundel in. Dezelfde splitsing als bij
 * booking-status.ts en translation-keys.ts.
 */
export type SourceOptions = {
  members: Pick[];
  upcoming: Pick[];
  past: Pick[];
  /** Of de Band App bereikbaar was. Bij false valt er niets te kiezen. */
  available: boolean;
};

export type FactSources = {
  band?: { name: string; bio?: string; city?: string };
  members?: FactMember[];
  upcoming?: FactShow[];
  past?: FactShow[];
  setlist?: { title: string; artist: string }[];
  site?: { label: string; text: string }[];
  socials?: { label: string; url: string }[];
  /** Waar de tekst over gaat: één lid of één show, apart uitgelicht. */
  subject?: { label: string; lines: string[] } | null;
  /** Feiten die nergens in een database staan. Zie de kop van dit bestand. */
  notes?: string;
};

export type Factsheet = {
  /** Het blok dat naar het model gaat en waar de controle tegenaan rekent. */
  text: string;
  /** Welke kopjes erin zijn gekomen, voor het scherm. */
  sections: string[];
  /** Of er iets in staat. Een leeg feitenblad is geen bron. */
  empty: boolean;
};

const schoon = (waarde: string | null | undefined) => (waarde ?? "").trim();

/** Een regel met een label, of niets als er niets staat. */
function regel(label: string, waarde: string | null | undefined): string | null {
  const tekst = schoon(waarde);
  return tekst ? `${label}: ${tekst}` : null;
}

function showRegel(show: FactShow): string {
  return [
    show.when,
    [schoon(show.venue), schoon(show.city)].filter(Boolean).join(", "),
    schoon(show.status),
    schoon(show.note),
    schoon(show.ticketUrl),
  ]
    .filter(Boolean)
    .join(" · ");
}

function lidRegel(lid: FactMember): string {
  const kop = [schoon(lid.name), schoon(lid.role) || schoon(lid.instrument)]
    .filter(Boolean)
    .join(" — ");
  const bio = schoon(lid.bio);
  return bio ? `${kop}. ${bio}` : kop;
}

/**
 * De bronnen tot één blok tekst maken.
 *
 * Vaste kopjes in hoofdletters, zodat het model ziet waar iets vandaan komt en
 * een mens het feitenblad kan nalezen als er een vlag op staat. De volgorde ligt
 * vast: hetzelfde feitenblad hoort er twee keer hetzelfde uit te zien, anders
 * verandert de prompt zonder dat er inhoudelijk iets veranderd is.
 */
export function buildFactsheet(sources: FactSources): Factsheet {
  const blokken: { kop: string; regels: string[] }[] = [];

  const voegToe = (kop: string, regels: (string | null)[]) => {
    const gevuld = regels.filter((r): r is string => !!r && r.trim().length > 0);
    if (gevuld.length > 0) blokken.push({ kop, regels: gevuld });
  };

  // Waar de tekst over gaat staat vooraan: dat is het feit dat ertoe doet, en
  // het staat verderop nog een keer tussen de rest.
  if (sources.subject) {
    voegToe(`ONDERWERP — ${sources.subject.label.toUpperCase()}`, sources.subject.lines);
  }

  if (sources.band) {
    voegToe("BAND", [
      regel("naam", sources.band.name),
      regel("plaats", sources.band.city),
      regel("bio", sources.band.bio),
    ]);
  }

  if (sources.members?.length) {
    voegToe(
      "LEDEN",
      sources.members.map(lidRegel),
    );
  }

  if (sources.upcoming?.length) {
    voegToe("AGENDA — KOMEND", sources.upcoming.map(showRegel));
  }

  if (sources.past?.length) {
    voegToe("AGENDA — GESPEELD", sources.past.map(showRegel));
  }

  if (sources.setlist?.length) {
    // Het aantal erbij: "negentien nummers" is zelf een feit dat in een bio of
    // one-sheet thuishoort, en zonder deze regel zou het model het moeten tellen.
    voegToe("SETLIST", [
      `aantal nummers: ${sources.setlist.length}`,
      ...sources.setlist.map((song) =>
        [schoon(song.title), schoon(song.artist)].filter(Boolean).join(" — "),
      ),
    ]);
  }

  if (sources.site?.length) {
    voegToe(
      "SITETEKST",
      sources.site.map((item) => regel(item.label, item.text)),
    );
  }

  if (sources.socials?.length) {
    voegToe(
      "SOCIALS",
      sources.socials.map((item) => regel(item.label, item.url)),
    );
  }

  const notes = schoon(sources.notes);
  if (notes) voegToe("AANTEKENINGEN VAN DE SCHRIJVER", notes.split(/\n+/));

  return {
    text: blokken
      .map(({ kop, regels }) => [kop, ...regels.map((r) => `- ${r}`)].join("\n"))
      .join("\n\n"),
    sections: blokken.map(({ kop }) => kop),
    empty: blokken.length === 0,
  };
}
