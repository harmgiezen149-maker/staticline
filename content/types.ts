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
    /** Naam van het menu als geheel, voor een schermlezer. */
    menu: string;
    /** De hamburgerknop, dicht en open. Een schermlezer hoort te weten wat hij doet. */
    menuOpen: string;
    menuClose: string;
    /** Het kanaallabel tijdens een paginaovergang naar de homepage. */
    home: string;
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
    /** De link naar het besloten deel. */
    portal: string;
  };

  /**
   * Teksten van de beweging uit v2: de loader, de lightbox en de labels die met
   * de muis meelopen. Klein, maar wel in beide talen.
   */
  motion: {
    /** De verborgen link bovenaan voor wie met het toetsenbord navigeert. */
    skip: string;
    loaderLabel: string;
    loaderHint: string;
    /** Het label dat meeloopt over een foto. */
    view: string;
    /** Het label dat meeloopt over een klikbare show. */
    tickets: string;
    /** Voor een schermlezer, op de knop over een foto; gevolgd door het bijschrift. */
    enlarge: string;
    /** De lightbox en zijn sluitknop. */
    photo: string;
    close: string;
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
    /** Link van de bandsectie op de homepage naar de volledige pagina. */
    more: string;
    /** De knoppen van de schuivende rij leden op de homepage, voor een schermlezer. */
    prev: string;
    next: string;
    pause: string;
    play: string;
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

  /**
   * De pagina waar de bevestigingslink uit de nieuwsbriefmail op uitkomt.
   * Vier uitkomsten, want een kapotte link hoort iets anders te zeggen dan een
   * link die al gebruikt is.
   */
  confirm: {
    title: string;
    ok: string;
    unknown: string;
    noToken: string;
    error: string;
    home: string;
  };

  /**
   * De teksten van de uitgaande mail.
   *
   * Als regels, niet als één lap tekst: lib/mail.ts maakt er zowel platte tekst
   * als HTML van, en een lege string is een witregel. Alles met {haakjes} wordt
   * ingevuld door de aanroeper.
   */
  /** De pagina achter de afmeldlink onderaan elke nieuwsbrief. */
  unsubscribe: {
    title: string;
    question: string;
    button: string;
    done: string;
    unknown: string;
    error: string;
    home: string;
  };
  mail: {
    /** Bevestiging aan wie een boeking of vraag instuurde. */
    bookingSubject: string;
    bookingGreeting: string;
    bookingBooking: string;
    bookingQuestion: string;
    bookingCopy: string;
    /** Dubbele opt-in voor de nieuwsbrief. */
    newsletterSubject: string;
    newsletterGreeting: string;
    newsletterBody: string;
    newsletterIgnore: string;
    /** De aankondiging van een nieuwe show. `{show}` wordt de naam van de show. */
    showSubject: string;
    showGreeting: string;
    showIntro: string;
    showTickets: string;
    showAgenda: string;
    showOutro: string;
    /** Onderaan, met de afmeldlink erachter. */
    showFooter: string;
    signature: string;
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
