/**
 * De inhoud van /grunge ("Waar we vandaan komen"), per taal.
 *
 * Een eigen bestand en niet in content/nl.ts: het is één lang verhaal dat
 * grotendeels uit lijsten bestaat, en lijsten staan niet in /beheer/inhoud (zie
 * lib/copy-paths.ts). Het Nederlands komt uit het verslag dat de band heeft
 * opgesteld, het Engels uit de slides die daarbij horen.
 *
 * Tekst tussen *sterretjes* wordt cursief: albumtitels en films. Zie `Rich` in
 * components/pages/GrungePage.tsx.
 */

/** De kleur van een vlak: de tokens van de site, plus het geel van deze pagina. */
export type Tone = "red" | "teal" | "geel" | "cream" | "grey";

export type GrungeCopy = {
  meta: { title: string; description: string };
  hero: { kicker: string; meta: string; title: string; subtitle: string; tag: string; lede: string };
  /** De kanaalkiezer onder de kop. */
  navLabel: string;
  nowPlaying: string;
  /** De korte regels onder drie kanalen in het instapblok op de homepage. */
  teaser: { seattle: string; spot: string; top12: string };
  chapters: {
    summary: Chapter;
    seattle: Chapter;
    recipe: Chapter;
    scene: Chapter;
    spot: Chapter;
    versus: Chapter;
    bands: Chapter;
    breakthrough: Chapter;
    legacy: Chapter;
    timeline: Chapter;
    top12: Chapter;
  };
  summary: {
    paragraphs: string[];
    quiet: string;
    now: string;
    where: { label: string; title: string; sub: string };
    when: { label: string; periods: { years: string; text: string }[] };
    bigFour: { label: string; text: string };
    record: { label: string; title: string; sub: string };
  };
  seattle: { tag: string; intro: string; reasons: { title: string; text: string }[]; now: string };
  recipe: {
    items: { code: string; title: string; who: string; text: string }[];
    cassette: string;
    result: string;
    quote: string;
  };
  scene: {
    note: { title: string; text: string };
    steps: { year: string; title: string; text: string }[];
    now: string;
  };
  spot: {
    tag: string[];
    traits: { title: string; text: string; listen: string }[];
    bass: {
      kicker: string;
      title: string;
      text: string;
      players: { name: string; band: string; listen: string }[];
    };
  };
  versus: {
    intro: string;
    columns: { name: string; era: string }[];
    rows: { label: string; values: string[] }[];
    notes: { title: string; text: string }[];
  };
  bands: {
    intro: string;
    bigFour: { name: string; from: string; text: string; albums: { year: string; title: string }[]; tone: Tone }[];
    tree: {
      title: string;
      text: string;
      greenRiver: string;
      malfunkshun: string;
      mudhoney: string;
      motherLoveBone: string;
      pearlJam: string;
      soundgarden: string;
      temple: string;
      split: string;
      wood: string;
      vedder: string;
    };
    pioneers: { title: string; tag: string; items: { name: string; text: string; listen: string }[] };
  };
  breakthrough: {
    news: string;
    date: string;
    headline: { hot: string; rest: string };
    text: string;
    items: string[];
    breaking: string;
    ticker: string;
    decline: { kicker: string; date: string; text: string; items: string[] };
    after: {
      title: string;
      rewind: string;
      items: { band: string; text: string }[];
      hallTitle: string;
      hall: { year: string; band: string }[];
    };
  };
  legacy: {
    tag: string;
    channels: { kicker: string; title: string; text: string; bands: string; tone: Tone }[];
    post: {
      kicker: string;
      title: string;
      text: string;
      critics: string[];
      head: string[];
      waves: { name: string; years: string; bands: string; albums: string; heir?: boolean }[];
    };
  };
  timeline: {
    intro: string;
    phases: { name: string; years: string; tone: Tone }[];
    years: { year: string; text: string; tone?: Tone }[];
  };
  top12: {
    intro: string;
    /** Komt later; zolang leeg staat er geen knop. */
    spotify: string;
    spotifyLabel: string;
    items: { title: string; note: string; year: string }[];
  };
  outro: {
    kicker: string;
    title: string;
    text: string;
    show: string;
    book: string;
    setKicker: string;
    setText: string;
    sourcesTitle: string;
    sources: { text: string; href: string; suffix: string }[];
    sourcesNote: string;
  };
};

export type Chapter = { nav: string; label: string; title: string };

/**
 * De artiesten op deze pagina, om nummers uit de eigen setlist te herkennen
 * ("Uit onze set"). Kleine letters; vergeleken zonder hoofdletters en "The".
 */
export const PAGE_ARTISTS = [
  "nirvana", "pearl jam", "soundgarden", "alice in chains", "melvins", "green river", "mudhoney",
  "malfunkshun", "mother love bone", "temple of the dog", "screaming trees", "tad", "mad season",
  "hole", "l7", "skin yard", "stone temple pilots", "bush", "candlebox", "silverchair", "live",
  "collective soul", "foo fighters", "creed", "matchbox twenty", "3 doors down", "nickelback",
  "puddle of mudd", "staind", "fuel", "seether", "three days grace", "shinedown", "breaking benjamin",
  "alter bridge", "daughtry", "audioslave", "godsmack", "deftones", "korn", "system of a down",
  "queens of the stone age", "kyuss", "wolf alice", "title fight", "narrow head", "softcult", "wisp",
];
