/**
 * Een binnenkomende aanvraag opschonen.
 *
 * Geen database, geen netwerk, geen React — zodat lib/booking.test.ts het kan
 * narekenen. Dezelfde splitsing die de Band App zelf ook maakt.
 */

export const BOOKING_KINDS = ["booking", "question"] as const;
export type BookingKind = (typeof BOOKING_KINDS)[number];

/** De drie praktische velden hebben dezelfde drie antwoorden. */
export const CHOICES = ["yes", "no", "unknown"] as const;
export type Choice = (typeof CHOICES)[number];

/** Bij de PA hoort er een vierde bij: te huren. */
export const PA_CHOICES = ["yes", "rent", "no", "unknown"] as const;
export type PaChoice = (typeof PA_CHOICES)[number];

export type Booking = {
  kind: BookingKind;
  name: string;
  email: string;
  phone: string;
  /** De elf boekingsvelden. Leeg bij een algemene vraag. */
  date: string;
  location: string;
  time: string;
  duration: string;
  eventType: string;
  budget: string;
  roomSize: string;
  parking: Choice;
  backstage: Choice;
  pa: PaChoice;
  message: string;
};

export type BookingError =
  | "bot"
  | "no-name"
  | "no-email"
  | "captcha"
  | "too-many";

/**
 * Ruwe controle op een e-mailadres: iets, een apenstaartje, iets met een punt.
 *
 * Bewust ruw. Het enige wat ermee gebeurt is erop antwoorden, en een strenge
 * controle houdt echte adressen tegen — er bestaan meer geldige adressen dan de
 * meeste reguliere expressies denken.
 */
export const looksLikeEmail = (value: unknown): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? ""));

const MAX = {
  name: 120,
  email: 160,
  phone: 40,
  date: 120,
  location: 160,
  time: 40,
  duration: 80,
  eventType: 80,
  budget: 80,
  roomSize: 80,
  message: 2000,
} as const;

const trim = (value: unknown, max: number) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

function readChoice(value: unknown): Choice {
  const v = String(value ?? "").trim();
  return (CHOICES as readonly string[]).includes(v) ? (v as Choice) : "unknown";
}

function readPaChoice(value: unknown): PaChoice {
  const v = String(value ?? "").trim();
  return (PA_CHOICES as readonly string[]).includes(v)
    ? (v as PaChoice)
    : "unknown";
}

/**
 * Wat er van het formulier bruikbaar is.
 *
 * Geeft een reden terug als de aanvraag geweigerd hoort te worden. Naam en
 * e-mailadres zijn het enige wat echt moet: de rest is behulpzaam, en iemand die
 * vraagt of de band op een zaterdag in mei kan, hoort niet eerst tien velden te
 * moeten invullen.
 */
export function readBooking(
  body: Record<string, unknown>,
): { data: Booking } | { error: BookingError } {
  // Het verborgen veld hoort leeg te blijven. Bots vullen elk veld dat ze
  // tegenkomen; een mens ziet dit veld niet eens staan.
  if (trim(body?.website, 200)) return { error: "bot" };

  const name = trim(body?.name, MAX.name);
  const email = trim(body?.email, MAX.email);
  if (!name) return { error: "no-name" };
  if (!looksLikeEmail(email)) return { error: "no-email" };

  const kind: BookingKind =
    body?.kind === "booking" ? "booking" : "question";

  // Bij een algemene vraag zijn de boekingsvelden niet eens getoond. Ze worden
  // hier leeggelaten in plaats van overgenomen, zodat er geen restanten van een
  // half ingevuld formulier meegaan als iemand van tabblad wisselt.
  const isBooking = kind === "booking";
  const field = (key: keyof typeof MAX) =>
    isBooking ? trim(body?.[key], MAX[key]) : "";

  return {
    data: {
      kind,
      name,
      email,
      phone: trim(body?.phone, MAX.phone),
      date: field("date"),
      location: field("location"),
      time: field("time"),
      duration: field("duration"),
      eventType: field("eventType"),
      budget: field("budget"),
      roomSize: field("roomSize"),
      parking: isBooking ? readChoice(body?.parking) : "unknown",
      backstage: isBooking ? readChoice(body?.backstage) : "unknown",
      pa: isBooking ? readPaChoice(body?.pa) : "unknown",
      message: trim(body?.message, MAX.message),
    },
  };
}

/** Leesbare labels voor in de mail en in de Band App. */
const LABELS: Record<string, string> = {
  date: "Datum",
  location: "Locatie",
  time: "Tijd",
  duration: "Speelduur",
  eventType: "Type event",
  budget: "Budget",
  roomSize: "Grootte van de ruimte",
  parking: "Parkeergelegenheid",
  backstage: "Backstage / veilige opslag",
  pa: "PA aanwezig",
};

const CHOICE_LABELS: Record<string, string> = {
  yes: "ja",
  no: "nee",
  rent: "in te huren",
  unknown: "onbekend",
};

/**
 * De aanvraag als leesbare tekst.
 *
 * De Band App kent zes velden op een BookingRequest en niet de elf van dit
 * formulier. In plaats van daar nóg een reeks kolommen bij te zetten, gaat alles
 * wat niet past als nette tekst mee in het bericht — dat is wat een bandlid toch
 * leest als de melding binnenkomt. De volledige, gestructureerde aanvraag staat
 * in de eigen database van de website.
 */
export function bookingToText(booking: Booking): string {
  const lines: string[] = [];

  const keys = [
    "date",
    "location",
    "time",
    "duration",
    "eventType",
    "budget",
    "roomSize",
  ] as const;

  for (const key of keys) {
    const value = booking[key];
    if (value) lines.push(`${LABELS[key]}: ${value}`);
  }

  for (const key of ["parking", "backstage", "pa"] as const) {
    // Onbekend is geen informatie; die regel weglaten houdt het bericht kort.
    if (booking[key] !== "unknown") {
      lines.push(`${LABELS[key]}: ${CHOICE_LABELS[booking[key]]}`);
    }
  }

  if (booking.message) {
    if (lines.length) lines.push("");
    lines.push(booking.message);
  }

  return lines.join("\n");
}
