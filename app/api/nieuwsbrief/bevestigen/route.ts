import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

/**
 * De tweede helft van de dubbele opt-in.
 *
 * De link uit de bevestigingsmail komt hier binnen. Eén sleutel, één keer: na
 * bevestigen doet dezelfde link niets meer dan hetzelfde antwoord geven.
 *
 * Een GET die iets verandert is normaal een slecht idee, maar een link in een
 * mail kan niets anders dan een GET zijn — en dat is precies waar deze sleutel
 * voor bedoeld is.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "no-token" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "no-database" }, { status: 503 });
  }

  try {
    const rows = await sql`
      UPDATE newsletter_subscribers
         SET confirmed_at = COALESCE(confirmed_at, now())
       WHERE token = ${token}
      RETURNING email
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "unknown-token" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[nieuwsbrief] bevestigen mislukt:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
