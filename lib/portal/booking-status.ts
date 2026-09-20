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

/**
 * Welke aanvragen een andere stand blijken te hebben in de Band App.
 *
 * Het rekenwerk van lib/portal/booking-sync.ts, hier apart omdat die module
 * `server-only` importeert en de database aanraakt — dezelfde splitsing als bij
 * seal.ts en mail-html.ts. Wat de moeite van een test waard is, hoort niet vast
 * te zitten aan een module die alleen op de server kan bestaan.
 *
 * Twee gevallen worden bewust overgeslagen:
 *
 * - **Een id dat niet terugkwam.** Dan bestaat de aanvraag daar niet meer; hij
 *   is in de Band App weggegooid. Deze site is het archief en hoort niet mee te
 *   verdwijnen, dus de stand hier blijft staan.
 * - **Een stand die deze site niet kent.** Een nieuwere Band App zou er een bij
 *   kunnen krijgen. Die overnemen zou een waarde in de database zetten waar het
 *   scherm hier geen label voor heeft.
 */
export function changedStatuses(
  rows: { id: number; band_app_id: number; status: string }[],
  statuses: Record<number, string>,
): { id: number; status: Status }[] {
  const uitkomst: { id: number; status: Status }[] = [];

  for (const row of rows) {
    const daar = statuses[row.band_app_id];
    if (daar === undefined) continue;
    if (!isStatus(daar)) continue;
    if (daar === row.status) continue;
    uitkomst.push({ id: row.id, status: daar });
  }

  return uitkomst;
}
