import type { Copy } from "./types";

/** Engelse copy. Zie content/nl.ts voor waarom twee regels afwijken van het ontwerp. */
export const en: Copy = {
  meta: {
    title: "Static Line",
    description: "Raw, wired rock from Nijmegen. Shows, photos and bookings.",
  },
  nav: {
    shows: "Shows",
    photos: "Photos",
    band: "Band",
    booking: "Booking",
    menu: "Menu",
    language: "Language",
  },
  hero: {
    kickerFirst: "First show",
    kickerNext: "Next show",
    kickerNone: "No shows scheduled yet",
    sub: "Raw, wired rock from Nijmegen. No detours. Loose strings, blown amps, a set that never sits still.",
    subShort: "Raw rock from Nijmegen. No detours.",
    wordmarkAlt: "Static Line",
    ctaBook: "Book us",
    ctaShows: "All shows",
  },
  nextShow: {
    label: "Next show",
    tickets: "Tickets",
    none: "No shows scheduled",
  },
  shows: {
    heading: "All shows",
    count: { one: "{count} date", other: "{count} dates" },
    viewAll: "Full schedule",
    empty: "Nothing in the calendar yet.",
  },
  status: {
    release: "Release show",
    tickets: "Tickets",
    announced: "Announced",
    soldout: "Sold out",
  },
  photos: {
    heading: "Photos",
    placeholders: [
      "live shot — duotone red",
      "band portrait",
      "crowd — duotone teal",
      "backstage",
      "guitar detail",
    ],
  },
  footer: {
    note: "Static Line · Nijmegen · Booking and tech rider on request",
    mail: "boeking@staticline.nl",
  },
};
