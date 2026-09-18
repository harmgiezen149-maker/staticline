import type { Copy } from "./types";

/**
 * Nederlandse copy.
 *
 * De homepage-teksten komen uit het ontwerpprototype. Twee dingen zijn bewust
 * veranderd ten opzichte van het ontwerp, allebei omdat de werkelijkheid anders
 * bleek:
 *
 * - De subkop noemde "Drie man, geen omweg". Er staan vier leden in de Band App,
 *   en de bezetting kan wijzigen; de tekst noemt daarom geen aantal meer.
 * - Het ontwerp presenteerde de eerste show als releaseshow met support. Dat is
 *   niet wat er speelt, en de band speelt covers. De copy blijft daarom open,
 *   zodat er niets herschreven hoeft te worden zodra er eigen werk is.
 *
 * De teksten voor de overige pagina's zijn nieuw en niet ontworpen; ze volgen de
 * toon van de homepage. Waar inhoud ontbreekt staat er wat er komt, niet niets.
 */
export const nl: Copy = {
  meta: {
    title: "Static Line",
    description:
      "Rauwe, opgefokte rock uit Nijmegen. Shows, foto's en boekingen.",
  },
  nav: {
    shows: "Shows",
    photos: "Foto's",
    band: "Band",
    music: "Muziek",
    video: "Video",
    booking: "Boeken",
    menu: "Menu",
    language: "Taal",
  },
  hero: {
    kickerFirst: "Eerste show",
    kickerNext: "Volgende show",
    kickerNone: "Nog geen shows gepland",
    sub: "Rauwe, opgefokte rock uit Nijmegen. Geen omweg. Losse snaren, kapotte versterkers en een set die niet stilstaat.",
    subShort: "Rauwe rock uit Nijmegen. Geen omweg.",
    wordmarkAlt: "Static Line",
    ctaBook: "Boek ons",
    ctaShows: "Alle shows",
  },
  nextShow: {
    label: "Volgende show",
    tickets: "Tickets",
    none: "Geen shows gepland",
  },
  shows: {
    heading: "Alle shows",
    count: { one: "{count} datum", other: "{count} data" },
    viewAll: "Volledige agenda",
    empty: "Er staat nog niets in de agenda.",
  },
  status: {
    release: "Releaseshow",
    tickets: "Tickets",
    announced: "Aangekondigd",
    soldout: "Uitverkocht",
  },
  photos: {
    heading: "Foto's",
    placeholders: [
      "live shot — duotone rood",
      "bandportret",
      "crowd — duotone teal",
      "backstage",
      "gitaar detail",
    ],
  },
  footer: {
    note: "Static Line · Nijmegen · Boekingen en technische rider op aanvraag",
    mail: "boeking@staticline.nl",
    social: "Volg ons",
  },

  agenda: {
    title: "Agenda",
    intro:
      "Waar we spelen. Staat er niets bij dat in de buurt komt? Vraag ons dan gewoon.",
    upcoming: "Komende shows",
    archive: "Geweest",
    archiveEmpty: "Nog niets gespeeld. Dat verandert op 10 november.",
    map: "Op de kaart",
    mapEmpty:
      "Zodra er coördinaten bij de shows staan, verschijnt hier een kaart.",
  },

  band: {
    title: "Over de band",
    intro: "",
    members: "Bandleden",
    bioEmpty:
      "De bandtekst wordt nog geschreven. Tot die tijd: vier man, gitaren te hard, en een voorkeur voor nummers uit de jaren negentig die nog steeds pijn doen.",
    membersEmpty: "De bezetting wordt nog ingevuld.",
    noRole: "Bandlid",
  },

  music: {
    title: "Muziek",
    intro: "Wat we spelen.",
    spotify: "Luisteren",
    setlist: "Wat we spelen",
    setlistNote:
      "Deze lijst komt rechtstreeks uit de app van de band en verandert dus mee.",
    empty:
      "Er staat nog niets online. Kom naar een show, dat is toch waar het om gaat.",
  },

  video: {
    title: "Video",
    intro: "Beeld van de band.",
    empty: "Er is nog geen video. Zodra er iets gefilmd is, staat het hier.",
  },

  gallery: {
    title: "Foto's",
    intro: "",
  },

  embed: {
    load: "{service} laden",
    note: "Wordt pas geladen als je erop klikt — anders zet {service} cookies bij iedereen die langskomt.",
  },

  confirm: {
    title: "Aanmelding bevestigd",
    ok: "Gelukt. Je staat op de lijst en krijgt een mail zodra er een show bij komt.",
    unknown:
      "Deze link werkt niet meer. Meld je opnieuw aan, dan sturen we een nieuwe.",
    noToken: "Er staat geen sleutel in deze link. Kopieer hem nog eens uit de mail.",
    error: "Er ging iets mis aan onze kant. Probeer het zo nog eens.",
    home: "Naar de site",
  },

  mail: {
    bookingSubject: "We hebben je bericht binnen — Static Line",
    bookingGreeting: "Hoi {name},",
    bookingBooking:
      "Bedankt voor je boekingsaanvraag. We hebben hem binnen en komen erop terug, meestal binnen een paar dagen.",
    bookingQuestion:
      "Bedankt voor je bericht. We hebben het gelezen en komen erop terug, meestal binnen een paar dagen.",
    bookingCopy: "Dit is wat je ons stuurde:",
    newsletterSubject: "Bevestig je aanmelding — Static Line",
    newsletterGreeting: "Hoi,",
    newsletterBody:
      "Klik op deze link om je aanmelding voor de nieuwsbrief te bevestigen:",
    newsletterIgnore:
      "Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder deze klik sturen we je niets.",
    signature: "Static Line · Nijmegen · staticline.nl",
  },

  newsletter: {
    title: "Blijf op de hoogte",
    body: "Een mail als er een show bij komt. Niet vaker.",
    placeholder: "jouw@email.nl",
    submit: "Aanmelden",
    ok: "Bijna klaar — klik op de link in de mail die we net gestuurd hebben.",
    error: "Dat ging mis. Probeer het zo nog eens.",
    consent: "Afmelden kan met één klik, in elke mail.",
  },

  booking: {
    title: "Boeken",
    intro:
      "Wil je ons boeken, of heb je een vraag? Vul dit in en je krijgt antwoord. Hoe meer je invult, hoe sneller we iets zinnigs kunnen zeggen.",
    kindLabel: "Waar gaat het over?",
    kindBooking: "Boeking",
    kindQuestion: "Algemene vraag",
    groupContact: "Wie ben je",
    groupWhen: "Wanneer",
    groupPlace: "Waar",
    groupTech: "Techniek en praktisch",
    groupMessage: "Je bericht",
    fields: {
      name: "Naam",
      email: "E-mail",
      phone: "Telefoon",
      date: "Datum",
      datePlaceholder: "bijv. 14 maart, of ergens in mei",
      location: "Locatie",
      time: "Tijd",
      timePlaceholder: "bijv. 21:00",
      duration: "Speelduur",
      durationPlaceholder: "bijv. 2 × 45 minuten",
      eventType: "Type event",
      eventTypePlaceholder: "café, festival, feest, bruiloft…",
      budget: "Budget",
      budgetPlaceholder: "bijv. 350, of een bereik",
      roomSize: "Grootte van de ruimte",
      roomSizePlaceholder: "bijv. 150 man",
      parking: "Parkeergelegenheid",
      backstage: "Backstage of veilige opslag",
      pa: "PA aanwezig",
      message: "Bericht",
      messagePlaceholder: "Alles wat we verder moeten weten.",
    },
    choice: {
      yes: "Ja",
      no: "Nee",
      unknown: "Weet ik niet",
      rent: "In te huren",
    },
    submit: "Versturen",
    sending: "Bezig…",
    ok: "Verstuurd.",
    okNote: "Je hoort van ons. Meestal binnen een paar dagen.",
    errorGeneric:
      "Het versturen lukte niet. Probeer het nog eens, of mail ons rechtstreeks.",
    errorName: "Vul je naam in.",
    errorEmail: "Vul een e-mailadres in waar we je op kunnen bereiken.",
    errorCaptcha: "De controle is niet gelukt. Probeer het nog eens.",
    required: "verplicht",
    optional: "mag leeg",
    riderTitle: "Technische rider en podiumplan",
    riderBody:
      "Wat wij meenemen, wat de zaal levert, de inputlijst en waar we staan. Altijd de actuele versie, rechtstreeks uit de app van de band.",
    riderLink: "Rider bekijken",
    riderEmpty:
      "De rider is er nog niet in een deelbare vorm. Vraag ernaar en we sturen hem.",
  },
};
