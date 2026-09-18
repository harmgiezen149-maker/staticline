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
    music: string;
    video: string;
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
    social: string;
  };

  /** De agendapagina. */
  agenda: {
    title: string;
    intro: string;
    upcoming: string;
    archive: string;
    archiveEmpty: string;
    map: string;
    /** Getoond als er nog geen coördinaten bij de shows staan. */
    mapEmpty: string;
  };

  /** De bandpagina: over de band plus de bandleden. */
  band: {
    title: string;
    intro: string;
    members: string;
    /** Als er nog geen bio in de Band App staat. */
    bioEmpty: string;
    membersEmpty: string;
    /** Label onder een lid zonder eigen tekst. */
    noRole: string;
  };

  /** De muziekpagina. */
  music: {
    title: string;
    intro: string;
    spotify: string;
    setlist: string;
    setlistNote: string;
    empty: string;
  };

  /** De videopagina. */
  video: {
    title: string;
    intro: string;
    empty: string;
  };

  /** De fotopagina. */
  gallery: {
    title: string;
    intro: string;
  };

  /** Uitgestelde embeds van Spotify en YouTube. */
  embed: {
    /** Knoptekst, bevat {service}. */
    load: string;
    /** Uitleg waarom er eerst geklikt moet worden. */
    note: string;
  };

  /** De nieuwsbriefstrip. */
  newsletter: {
    title: string;
    body: string;
    placeholder: string;
    submit: string;
    ok: string;
    error: string;
    consent: string;
  };

  /** Het boekingsformulier. Dit is het belangrijkste blok op de site. */
  booking: {
    title: string;
    intro: string;
    /** De keuze bovenaan. */
    kindLabel: string;
    kindBooking: string;
    kindQuestion: string;
    /** Groepskoppen, zodat elf velden niet één kolom worden. */
    groupContact: string;
    groupWhen: string;
    groupPlace: string;
    groupTech: string;
    groupMessage: string;
    fields: {
      name: string;
      email: string;
      phone: string;
      date: string;
      datePlaceholder: string;
      location: string;
      time: string;
      timePlaceholder: string;
      duration: string;
      durationPlaceholder: string;
      eventType: string;
      eventTypePlaceholder: string;
      budget: string;
      budgetPlaceholder: string;
      roomSize: string;
      roomSizePlaceholder: string;
      parking: string;
      backstage: string;
      pa: string;
      message: string;
      messagePlaceholder: string;
    };
    /** Keuzes voor de drie ja/nee/onbekend-velden. */
    choice: {
      yes: string;
      no: string;
      unknown: string;
      rent: string;
    };
    submit: string;
    sending: string;
    ok: string;
    okNote: string;
    /** Foutmeldingen. */
    errorGeneric: string;
    errorName: string;
    errorEmail: string;
    errorCaptcha: string;
    required: string;
    optional: string;
    /** De downloadbare rider. */
    riderTitle: string;
    riderBody: string;
    riderLink: string;
    riderEmpty: string;
  };
};
