import { toCsv } from "@/lib/portal/csv";
import { log } from "@/lib/portal/audit";
import { getSession } from "@/lib/portal/session";
import { confirmed, list } from "@/lib/portal/subscribers";

/**
 * De abonnees als CSV.
 *
 * Standaard alleen de bevestigde adressen: dat is de lijst waar je aan mag
 * mailen. Met `?alles=1` krijg je ook de onbevestigde, om te kunnen zien of de
 * bevestigingsmail wel aankomt — maar die lijst is niet om aan te schrijven.
 *
 * Een route handler en geen server action: dit levert een bestand op, en dat is
 * precies waar een GET met de juiste headers voor is.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Niet ingelogd", { status: 401 });
  }
  if (session.role !== "admin") {
    return new Response("Alleen voor een beheerder", { status: 403 });
  }

  const all = new URL(request.url).searchParams.get("alles") === "1";
  const rows = all ? await list() : await confirmed();

  const csv = toCsv([
    ["email", "taal", "ook_nieuws", "bevestigd_op", "aangemeld_op"],
    ...rows.map((row) => [
      row.email,
      row.locale,
      row.wants_news ? "ja" : "nee",
      row.confirmed_at ?? "",
      row.created_at,
    ]),
  ]);

  await log({
    actor: session.email,
    action: "newsletter.export",
    detail: `${rows.length} adressen${all ? ", inclusief onbevestigde" : ""}`,
  });

  const today = new Date().toISOString().slice(0, 10);

  return new Response(
    // Een byte order mark vooraan, anders leest Excel op Windows é en ë verkeerd.
    `﻿${csv}`,
    {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="nieuwsbrief-${today}.csv"`,
        // Een ledenlijst hoort nergens in een cache te blijven hangen.
        "cache-control": "no-store",
      },
    },
  );
}
