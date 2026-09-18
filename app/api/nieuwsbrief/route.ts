import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { looksLikeEmail } from "@/lib/booking";
import { getDb } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import { makeLimiter } from "@/lib/rate-limit";

/**
 * Aanmelding voor de nieuwsbrief.
 *
 * Met dubbele opt-in, en dat is geen formaliteit: zonder bevestigingsstap kan
 * iemand anders jouw adres invullen, en dan stuurt de band ongevraagde mail naar
 * een vreemde. De aanmelding wordt opgeslagen met `confirmed_at` leeg; pas na een
 * klik op de link uit de bevestigingsmail telt hij mee.
 *
 * Die mail kan nog niet verstuurd worden — er is geen mailkoppeling. De sleutel
 * staat wel al in de database en /api/nieuwsbrief/bevestigen werkt, dus zodra er
 * mail is, is de keten rond zonder dat hier iets hoeft te veranderen.
 */
export const dynamic = "force-dynamic";

const allow = makeLimiter({ max: 5, windowMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "onbekend";

  if (!allow(ip)) {
    return NextResponse.json({ error: "too-many" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Een bot krijgt hetzelfde antwoord als een mens.
  if (String(body.website ?? "").trim()) return NextResponse.json({ ok: true });

  const email = String(body.email ?? "").trim().slice(0, 160).toLowerCase();
  if (!looksLikeEmail(email)) {
    return NextResponse.json({ error: "no-email" }, { status: 400 });
  }

  const rawLocale = String(body.locale ?? "nl");
  const locale = isLocale(rawLocale) ? rawLocale : "nl";

  const sql = getDb();
  if (!sql) {
    console.warn(
      `[nieuwsbrief] geen DATABASE_URL — aanmelding niet opgeslagen (${email})`,
    );
    // Wel `ok`: de bezoeker heeft niets verkeerd gedaan, en het alternatief is
    // een foutmelding over iets waar hij niets aan kan doen.
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(24).toString("base64url");

  try {
    // Nog eens aanmelden met hetzelfde adres is geen fout: dan komt er een
    // nieuwe sleutel, zodat een oude bevestigingsmail niet meer werkt. Een al
    // bevestigd abonnement blijft bevestigd.
    await sql`
      INSERT INTO newsletter_subscribers (email, locale, token)
      VALUES (${email}, ${locale}, ${token})
      ON CONFLICT (email) DO UPDATE
        SET token = EXCLUDED.token, locale = EXCLUDED.locale
    `;
  } catch (error) {
    console.error("[nieuwsbrief] opslaan mislukt:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // TODO zodra er een mailkoppeling is: stuur de bevestigingsmail met een link
  // naar /nieuwsbrief/bevestigen?token=<token>.
  console.warn(
    "[nieuwsbrief] geen mailkoppeling — bevestigingsmail niet verstuurd",
  );

  return NextResponse.json({ ok: true });
}
