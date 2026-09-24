/**
 * Losse velden van een show die uit de Band App komen maar niet één op één
 * over te nemen zijn. Apart van lib/shows.ts, omdat dat bestand `server-only`
 * is en dit getest wordt.
 */

const same = (a: string, b: string) =>
  a.localeCompare(b, "nl", { sensitivity: "base" }) === 0;

/**
 * De naam van de avond, zoals "LoBandNight" — of null als er geen eigen naam is.
 *
 * In de Band App is de titel een verplicht veld. Vroeger stond daar de zaal in
 * ("Loburg" of "Loburg, Wageningen"), en de zaal kwam er daaruit; nu hebben zaal
 * en plaats hun eigen velden. Een titel die alleen de zaal herhaalt, is geen
 * naam van de avond en wordt dus niet getoond — anders staat er twee keer
 * "Loburg" onder elkaar.
 *
 * @param explicitVenue  of de zaal uit zijn eigen veld kwam en niet uit de titel
 */
export function showTitle(
  rawTitle: string | null | undefined,
  venue: string,
  city: string,
  explicitVenue: boolean,
): string | null {
  const title = rawTitle?.trim() ?? "";
  if (!title || !explicitVenue) return null;
  if (same(title, venue)) return null;
  if (city && same(title, `${venue}, ${city}`)) return null;
  if (city && same(title, `${venue} ${city}`)) return null;
  return title;
}

/**
 * De aanvangstijd als "20:00", of null als er geen tijd is ingevuld.
 *
 * Uit het veld `time` dat de Band App zelf bijhoudt naast `startsAt`, en niet uit
 * de tijdstempel: een show zonder tijd staat daar op middernacht, en "00:00" op
 * de site is een tijd die niemand bedoeld heeft.
 */
export function showTime(time: string | null | undefined): string | null {
  const value = time?.trim() ?? "";
  return /^\d{1,2}[:.]\d{2}$/.test(value) ? value.replace(".", ":").padStart(5, "0") : null;
}
