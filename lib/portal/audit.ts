import "server-only";

import { getDb } from "@/lib/db";

/**
 * Het logboek van het besloten deel.
 *
 * Elke wijziging die iemand via /beheer maakt, komt hier terecht. Zie
 * docs/04-band-app-integration.md: de audittrail is geen latere verfijning maar
 * de reden dat de website mág schrijven.
 *
 * Faalt nooit hardop. Een logregel die niet weggeschreven kan worden, mag de
 * wijziging zelf niet tegenhouden — dan zou een volle database het beheer
 * blokkeren. Wel altijd een waarschuwing, zodat het opvalt.
 */
export async function log(entry: {
  actor: string;
  action: string;
  subject?: string;
  detail?: string;
}): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  try {
    await sql`
      INSERT INTO portal_audit_log (actor, action, subject, detail)
      VALUES (${entry.actor}, ${entry.action}, ${entry.subject ?? ""}, ${entry.detail ?? ""})
    `;
  } catch (error) {
    console.error("[beheer] logregel niet opgeslagen:", error);
  }
}

export type AuditEntry = {
  id: number;
  actor: string;
  action: string;
  subject: string;
  detail: string;
  created_at: string;
};

/** De laatste regels, nieuwste eerst. */
export async function recent(limit = 50): Promise<AuditEntry[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, actor, action, subject, detail, created_at
      FROM portal_audit_log
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows as AuditEntry[];
  } catch (error) {
    console.error("[beheer] logboek niet gelezen:", error);
    return [];
  }
}
