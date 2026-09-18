import type { Copy } from "./types";

/**
 * Nederlandse copy.
 *
 * Grotendeels overgenomen uit het ontwerpprototype. Twee dingen zijn bewust
 * veranderd ten opzichte van het ontwerp, allebei omdat de werkelijkheid anders
 * bleek:
 *
 * - De subkop noemde "Drie man, geen omweg". Er staan vier leden in de Band App,
 *   en de bezetting kan wijzigen; de tekst noemt daarom geen aantal meer.
 * - Het ontwerp presenteerde de eerste show als releaseshow met support. Dat is
 *   niet wat er speelt, en de band speelt covers. De copy blijft daarom open,
 *   zodat er niets herschreven hoeft te worden zodra er eigen werk is.
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
  },
};
