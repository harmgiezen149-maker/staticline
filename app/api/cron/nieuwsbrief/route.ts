import { NextResponse } from "next/server";

import { runRound } from "@/lib/announce";

/**
 * De ochtendronde: nieuwe shows aankondigen aan de nieuwsbrief.
 *
 * Vercel roept dit elke ochtend aan (zie `crons` in vercel.json) en zet daar
 * zelf `Authorization: Bearer <CRON_SECRET>` bij, als die variabele bij het
 * project staat. Zonder die sleutel doet dit adres niets: anders kan iedereen
 * die het adres raadt een ronde starten. Veel kwaad kan dat niet — een show gaat
 * hoe dan ook maar één keer de deur uit — maar hij gaat dan wel eerder dan de
 * ochtend, en dat is precies de bedenktijd die de ronde moet geven.
 *
 * Wat er gebeurt, staat in lib/announce.ts.
 */
export const dynamic = "force-dynamic";
// Honderden adressen in batches van honderd, met een pauze ertussen.
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error(
      "[aankondiging] geen CRON_SECRET ingesteld — ronde niet gedraaid",
    );
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runRound();
  console.log("[aankondiging] ronde:", JSON.stringify(result));
  return NextResponse.json(result);
}
