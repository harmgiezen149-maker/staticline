/**
 * Een CSV-bestand opbouwen.
 *
 * Zonder server-only, zodat het te testen is. En dat is het waard, want hier
 * zitten twee dingen in die makkelijk misgaan.
 *
 * Het eerste is gewoon aanhalingstekens: een veld met een komma of een
 * regelovergang moet tussen aanhalingstekens, en een aanhalingsteken ín dat veld
 * wordt verdubbeld.
 *
 * Het tweede is minder bekend. Een veld dat begint met `=`, `+`, `-` of `@` leest
 * Excel als een formule, niet als tekst. Iemand die zich aanmeldt met een adres
 * als `=HYPERLINK(...)@voorbeeld.nl` krijgt die formule dan uitgevoerd op de
 * computer van degene die het bestand opent. Daarom komt er een enkel
 * aanhalingsteken voor zo'n veld: Excel leest het dan als tekst en laat het
 * aanhalingsteken zelf weg.
 */

const RISKY = /^[=+\-@\t\r]/;

export function csvField(value: string): string {
  const safe = RISKY.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: string[][]): string {
  // Regelovergangen als CRLF: dat is wat RFC 4180 voorschrijft en wat Excel op
  // Windows verwacht.
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n");
}
