import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SchemaRunner } from "@/components/beheer/SchemaRunner";
import { Shell } from "@/components/beheer/Shell";
import { EXPECTED_TABLES, existingTables } from "@/lib/portal/schema";
import { getSession } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Database" };

/**
 * De tabellen bijhouden zonder terminal.
 *
 * De beheerder werkt vanuit de browser. Zonder dit scherm eindigt elke fase die
 * er een tabel bij krijgt in met de hand SQL plakken bij Neon — en precies dat
 * plakwerk is hoe de eerste keer misging: `npm run db:setup` meldde "klaar"
 * terwijl er niets stond.
 *
 * Alleen voor een beheerder. Een lid hoeft het schema niet te kunnen draaien, en
 * "hij kan toch niets kapotmaken" is geen reden om de knop te laten zien.
 */
export default async function DatabasePage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  const present = new Set(await existingTables());
  const missing = EXPECTED_TABLES.filter((table) => !present.has(table));

  return (
    <Shell session={session} title="Database">
      {session.role !== "admin" ? (
        <p className="text-muted">
          Alleen een beheerder kan de tabellen bijwerken.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-11 text-faint uppercase">Tabellen</h2>
            <ul className="flex flex-col">
              {EXPECTED_TABLES.map((table) => (
                <li
                  key={table}
                  className="flex items-baseline gap-3 border-b border-line py-2"
                >
                  <span
                    className={`font-mono text-11 uppercase ${
                      present.has(table) ? "text-faint" : "text-danger"
                    }`}
                  >
                    {present.has(table) ? "staat er" : "ontbreekt"}
                  </span>
                  <span className="font-mono text-12">{table}</span>
                </li>
              ))}
            </ul>
            {missing.length > 0 && (
              <p className="text-muted">
                {missing.length === EXPECTED_TABLES.length
                  ? "Er staat nog niets. Druk op de knop hieronder."
                  : `${missing.length} van de ${EXPECTED_TABLES.length} ontbreekt. Druk op de knop hieronder.`}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-11 text-faint uppercase">
              Bijwerken
            </h2>
            <p className="text-muted">
              Dit draait <span className="font-mono text-12">db/schema.sql</span>{" "}
              uit deze deploy. Elke opdracht daarin maakt alleen aan wat er nog
              niet is, dus je kunt dit zo vaak draaien als je wilt en er gaat
              niets verloren — er staat geen enkele opdracht in die iets
              verwijdert.
            </p>
            <SchemaRunner />
          </section>
        </div>
      )}
    </Shell>
  );
}
