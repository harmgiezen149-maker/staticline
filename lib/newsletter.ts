import "server-only";

import { getDb } from "./db";

/**
 * De tweede helft van de dubbele opt-in.
 *
 * Stond eerst in een API-route, maar de link uit een bevestigingsmail wordt door
 * een mens aangeklikt: die hoort op een pagina te landen die zegt wat er gebeurd
 * is, niet op een stuk JSON. De logica staat daarom hier, en de pagina's in
 * app/(nl)/nieuwsbrief/bevestigen en app/(en)/en/nieuwsbrief/bevestigen roepen
 * hem aan.
 *
 * Eén sleutel, één keer: na bevestigen doet dezelfde link niets meer dan
 * hetzelfde antwoord geven. `COALESCE` houdt het oorspronkelijke tijdstip vast,
 * zodat een tweede klik de datum niet opschuift.
 */
export type ConfirmResult = "ok" | "unknown" | "no-token" | "error";

export async function confirmSubscriber(
  token: string | undefined,
): Promise<ConfirmResult> {
  const clean = (token ?? "").trim();
  if (!clean) return "no-token";

  const sql = getDb();
  if (!sql) {
    console.error("[nieuwsbrief] geen DATABASE_URL — bevestigen niet mogelijk");
    return "error";
  }

  try {
    const rows = await sql`
      UPDATE newsletter_subscribers
         SET confirmed_at = COALESCE(confirmed_at, now())
       WHERE token = ${clean}
      RETURNING email
    `;

    return rows.length === 0 ? "unknown" : "ok";
  } catch (error) {
    console.error("[nieuwsbrief] bevestigen mislukt:", error);
    return "error";
  }
}
