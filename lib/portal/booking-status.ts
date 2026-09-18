/**
 * De statussen van een aanvraag.
 *
 * Los van bookings.ts, dat `server-only` importeert en de database aanraakt. Het
 * formulier waarmee je de status kiest draait in de browser, en zonder deze
 * splitsing trekt dat component de Neon-driver het clientbundel in — de build
 * weigert dat, terecht.
 *
 * Dezelfde reden als bij seal.ts en mail-html.ts: wat allebei de kanten nodig
 * hebben, hoort niet in een bestand te staan dat maar aan één kant mag bestaan.
 *
 * Dezelfde vier waarden als BookingRequest.status in de Band App, zodat de twee
 * schermen niet elk hun eigen woordenschat krijgen.
 */

export const STATUSES = ["new", "seen", "booked", "declined"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  new: "Nieuw",
  seen: "Gezien",
  booked: "Geboekt",
  declined: "Afgewezen",
};

export function isStatus(value: unknown): value is Status {
  return (STATUSES as readonly unknown[]).includes(value);
}
