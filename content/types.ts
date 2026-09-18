/**
 * De vorm van één taalbestand.
 *
 * Alle copy staat in content/nl.ts en content/en.ts, niet in componenten. Dat is
 * een eis uit docs/02-architecture.md: beide talen bestaan voor elke tekst. Door
 * het hier als type vast te leggen, breekt de build zodra één taal een tekst mist
 * in plaats van dat er een lege plek op de site verschijnt.
 *
 * Let op bij het vertalen: Engelse koppen lopen kort en Nederlandse lang. Een
 * regel die in de ene taal precies op één regel past, breekt in de andere.
 */
export type Copy = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    shows: string;
    photos: string;
    band: string;
    booking: string;
    /** Toegankelijke naam van de hamburgerknop op mobiel. */
    menu: string;
    /** Toegankelijke naam van de taalwissel. */
    language: string;
  };
  hero: {
    /** Kicker zolang de band nog niets gespeeld heeft. */
    kickerFirst: string;
    /** Kicker zodra er wél gespeelde shows zijn. */
    kickerNext: string;
    /** Kicker als er helemaal geen show gepland staat. */
    kickerNone: string;
    sub: string;
    /** Kortere variant voor mobiel; het ontwerp schrijft die expliciet voor. */
    subShort: string;
    wordmarkAlt: string;
    ctaBook: string;
    ctaShows: string;
  };
  nextShow: {
    label: string;
    tickets: string;
    /** Als de agenda leeg is. De sectie verdwijnt dan niet, de tekst verandert. */
    none: string;
  };
  shows: {
    heading: string;
    /**
     * Het aantal data naast de kop. Twee vormen, want "1 data" is geen
     * Nederlands. Welke vorm gekozen wordt, bepaalt Intl.PluralRules per taal —
     * zie components/ShowList.tsx. Beide bevatten {count}.
     */
    count: { one: string; other: string };
    /** Link onder de ingekorte lijst op mobiel. */
    viewAll: string;
    empty: string;
  };
  status: {
    release: string;
    tickets: string;
    announced: string;
    soldout: string;
  };
  photos: {
    heading: string;
    /** Beschrijvingen van de vijf nog te leveren beelden, uit de design-handoff. */
    placeholders: [string, string, string, string, string];
  };
  footer: {
    note: string;
    mail: string;
  };
};
