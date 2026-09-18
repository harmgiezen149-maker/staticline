"use server";

import { log } from "@/lib/portal/audit";
import { type ApplyResult, applySchema } from "@/lib/portal/schema";
import { getSession } from "@/lib/portal/session";

export type ActionState = ApplyResult | { ok: false; reason: "forbidden" } | null;

/**
 * De tabellen bijwerken.
 *
 * De rechtencontrole staat híér en niet alleen op de pagina. De Next-documentatie
 * waarschuwt daar met zoveel woorden voor: een server action is een adres dat
 * aangeroepen kan worden zonder dat de pagina eromheen ooit getoond is, dus een
 * afgeschermde pagina beveiligt de action niet.
 */
export async function runSchema(): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { ok: false, reason: "forbidden" };
  }

  const result = await applySchema();

  if (result.ok) {
    const failed = result.results.filter((entry) => !entry.ok).length;
    await log({
      actor: session.email,
      action: "schema.apply",
      detail:
        failed === 0
          ? `${result.results.length} opdrachten, alles goed`
          : `${result.results.length} opdrachten, ${failed} mislukt`,
    });
  }

  return result;
}
