import { NextResponse } from "next/server";

import { refreshToken } from "@/lib/instagram-feed";

/**
 * De Instagram-sleutel vernieuwen, elke maandagochtend.
 *
 * Een sleutel van Instagram verloopt na zestig dagen; ingeruild vóór die tijd
 * krijg je er weer zestig. Eén keer per week laat ruim marge voor een week waarin
 * het niet lukt. Vercel roept dit aan (zie `crons` in vercel.json) met
 * `Authorization: Bearer <CRON_SECRET>`, dezelfde sleutel als de ochtendronde
 * van de nieuwsbrief. Zie lib/instagram-feed.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("[instagram] geen CRON_SECRET ingesteld — sleutel niet vernieuwd");
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await refreshToken();
  if (result.ok) {
    console.log(`[instagram] sleutel vernieuwd, geldig voor ${result.expiresInDays} dagen`);
  } else if (result.reason !== "no-token") {
    console.error("[instagram] sleutel niet vernieuwd:", result.reason);
  }
  return NextResponse.json(result);
}
