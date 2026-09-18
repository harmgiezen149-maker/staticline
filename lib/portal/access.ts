/**
 * Wie er in het besloten deel mag, en met welke rechten.
 *
 * Geen gebruikerstabel. De band heeft vier leden en dat aantal verandert zelden;
 * twee omgevingsvariabelen in Vercel zijn daarvoor sneller te beheren dan een
 * uitnodigingsstroom met een eigen scherm, en er is niets te lekken omdat er geen
 * wachtwoorden zijn.
 *
 *   PORTAL_ADMINS="harm@example.nl"
 *   PORTAL_MEMBERS="vedran@example.nl, niels@example.nl, quinten@example.nl"
 *
 * Bewust niet uit de Band App opgehaald: /api/public laat e-mailadressen er juist
 * met opzet uit, en een tweede endpoint dat ze wél teruggeeft is een risico dat
 * dit probleem niet waard is.
 *
 * Geen `server-only` hier, zodat dit bestand te testen is. Er staat ook niets in
 * wat de browser niet mag weten — de lijst zelf komt uit process.env en komt daar
 * dus nooit terecht.
 */

export type Role = "admin" | "member";

/** Een kommalijst uit de omgeving, genormaliseerd. */
export function parseList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[,\s;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.includes("@"));
}

/**
 * De rol van een adres, of `null` als het er niet in staat.
 *
 * Admin wint van member, zodat een adres dat per ongeluk in beide lijsten staat
 * niet stil rechten kwijtraakt.
 */
export function roleFor(email: string): Role | null {
  const address = email.trim().toLowerCase();
  if (!address) return null;
  if (parseList(process.env.PORTAL_ADMINS).includes(address)) return "admin";
  if (parseList(process.env.PORTAL_MEMBERS).includes(address)) return "member";
  return null;
}

/**
 * Of het besloten deel überhaupt ingesteld is.
 *
 * Anders dan de captcha en de mail is dit géén optionele voorziening die
 * overgeslagen mag worden. Een ontbrekende sleutel mag een boeking nooit
 * tegenhouden, maar een ontbrekende sleutel mag ook nooit de deur openzetten:
 * zonder PORTAL_SECRET of zonder adressen komt hier niemand binnen.
 */
export function portalConfigured(): boolean {
  const secret = process.env.PORTAL_SECRET?.trim() ?? "";
  if (secret.length < 32) return false;
  return parseList(process.env.PORTAL_ADMINS).length > 0;
}
