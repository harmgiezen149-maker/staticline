import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getDb } from "@/lib/db";
import { splitStatements } from "@/lib/sql";

/**
 * De tabellen bijwerken vanuit het beheerscherm.
 *
 * Hetzelfde als `npm run db:setup`, maar zonder terminal. Dat is geen luxe: de
 * beheerder werkt vanuit de browser, en elke fase die er een tabel of kolom bij
 * krijgt zou anders eindigen in handmatig SQL plakken bij Neon.
 *
 * Er wordt niets anders gedraaid dan db/schema.sql, dat één bron van waarheid
 * blijft. Elke opdracht daarin heeft `IF NOT EXISTS`, dus vaker draaien is geen
 * probleem en er kan niets verloren gaan — er staat geen DROP of DELETE in.
 */

/** Wat er hoort te staan. Voor het overzicht, niet voor de uitvoering. */
export const EXPECTED_TABLES = [
  "booking_submissions",
  "newsletter_subscribers",
  "portal_audit_log",
  "portal_login_tokens",
  "site_content",
  "site_media",
] as const;

/**
 * Het schemabestand van schijf lezen.
 *
 * Op Vercel zit een serverloze functie alleen de bestanden die Next erbij
 * getraceerd heeft. Een `readFileSync` met een pad dat Next niet kan zien wordt
 * niet meegenomen, dus staat db/schema.sql expliciet in
 * `outputFileTracingIncludes` in next.config.ts. Haal dat daar niet weg.
 *
 * `process.cwd()` en niet `import.meta.url`: dat laatste wijst in een gebouwde
 * functie naar de map met de gebundelde brokken, niet naar de projectmap.
 */
export function readSchema(): string | null {
  try {
    return readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  } catch (error) {
    console.error("[beheer] db/schema.sql niet gevonden:", error);
    return null;
  }
}

/** Welke tabellen er nu staan. Lege lijst als de database niet bereikbaar is. */
export async function existingTables(): Promise<string[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = (await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `) as { table_name: string }[];
    return rows.map((row) => row.table_name);
  } catch (error) {
    console.error("[beheer] tabellen niet opgevraagd:", error);
    return [];
  }
}

export type StatementResult = {
  /** De eerste regel van de opdracht, om te laten zien wat er gebeurde. */
  label: string;
  ok: boolean;
  error?: string;
};

export type ApplyResult =
  | { ok: false; reason: "no-db" | "no-schema" }
  | { ok: true; results: StatementResult[] };

/**
 * db/schema.sql uitvoeren.
 *
 * Gaat door na een mislukte opdracht in plaats van te stoppen. Dat is het
 * omgekeerde van het script in scripts/db-setup.ts, en met reden: daar sta je
 * ernaast en wil je bij de eerste fout kijken wat er aan de hand is, hier krijg
 * je één scherm en wil je alles zien wat er misging in plaats van steeds één
 * regel verder te komen.
 */
export async function applySchema(): Promise<ApplyResult> {
  const sql = getDb();
  if (!sql) return { ok: false, reason: "no-db" };

  const schema = readSchema();
  if (!schema) return { ok: false, reason: "no-schema" };

  const results: StatementResult[] = [];

  for (const statement of splitStatements(schema)) {
    const label = statement.split("\n")[0].trim().slice(0, 70);
    try {
      await sql.query(statement);
      results.push({ label, ok: true });
    } catch (error) {
      results.push({
        label,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { ok: true, results };
}
