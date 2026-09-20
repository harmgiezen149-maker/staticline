import { getCopy } from "@/content";

import type { Booking } from "./bookings";

/**
 * De ingevulde velden van een aanvraag, als leesbare regels.
 *
 * De labels komen uit content/nl.ts — dezelfde die de bezoeker op het formulier
 * zag. Ze ergens opnieuw intypen zou betekenen dat "Grootte van de ruimte" ooit
 * op de ene plek verandert en op de andere niet.
 *
 * Hier apart en niet in het beheerscherm, omdat er inmiddels twee schermen zijn
 * die dit tonen: /beheer/boekingen en de Band App. Die laatste krijgt de regels
 * kant-en-klaar van deze kant, net als de datums bij de schrijfmodule. Eén plek
 * waar dit fout kan gaan in plaats van twee.
 *
 * `server-only` staat er niet: er zit niets in wat de browser niet mag weten, en
 * het beheerscherm rendert dit op de server terwijl de route het als JSON
 * verstuurt.
 */

const copy = getCopy("nl");
const LABELS = copy.booking.fields;

const CHOICE_LABELS: Record<string, string> = {
  yes: copy.booking.choice.yes,
  no: copy.booking.choice.no,
  unknown: copy.booking.choice.unknown,
  rent: copy.booking.choice.rent,
};

export type Row = { label: string; value: string };

/**
 * De negen velden die alleen bij een boeking horen.
 *
 * Bij een algemene vraag zijn ze allemaal leeg — dat formulier toont ze niet —
 * dus dan komt er een lege lijst uit.
 */
export function bookingRows(booking: Booking): Row[] {
  if (booking.kind !== "booking") return [];

  return [
    { label: LABELS.date, value: booking.wanted_date },
    { label: LABELS.location, value: booking.location },
    { label: LABELS.time, value: booking.wanted_time },
    { label: LABELS.duration, value: booking.duration },
    { label: LABELS.eventType, value: booking.event_type },
    { label: LABELS.budget, value: booking.budget },
    { label: LABELS.roomSize, value: booking.room_size },
    { label: LABELS.parking, value: CHOICE_LABELS[booking.parking] ?? booking.parking },
    { label: LABELS.backstage, value: CHOICE_LABELS[booking.backstage] ?? booking.backstage },
    { label: LABELS.pa, value: CHOICE_LABELS[booking.pa] ?? booking.pa },
  ];
}

/**
 * Hetzelfde, maar zonder wat er niet ingevuld is.
 *
 * Voor de Band App. Daar staat dit op een telefoon tussen de andere kaarten, en
 * daar is "Budget: niet ingevuld" alleen maar ruis. Het beheerscherm toont die
 * lege regels juist wél: daar wil je zien dát iemand een veld heeft overgeslagen.
 */
export function filledBookingRows(booking: Booking): Row[] {
  return bookingRows(booking).filter(
    (row) => row.value && row.value !== CHOICE_LABELS.unknown,
  );
}
