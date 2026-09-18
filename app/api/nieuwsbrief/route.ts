import { NextResponse } from "next/server";

import { looksLikeEmail } from "@/lib/booking";
import { makeLimiter } from "@/lib/rate-limit";

/**
 * Aanmelding voor de nieuwsbrief.
 *
 * Met dubbele opt-in, en dat is geen formaliteit: zonder bevestigingsstap kan
 * iemand anders jouw adres invullen, en dan stuurt de band ongevraagde mail naar
 * een vreemde. De bevestigingsmail en de opslag komen zodra de eigen database en
 * een mailkoppeling er zijn; tot die tijd wordt de aanmelding gelogd en krijgt de
 * bezoeker hetzelfde antwoord.
 *
 * Er wordt bewust nog niets verstuurd. Een lijst opbouwen zonder verzendkanaal is
 * prima; mensen mail beloven die niet komt, is dat niet.
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

  const email = String(body.email ?? "").trim().slice(0, 160);
  if (!looksLikeEmail(email)) {
    return NextResponse.json({ error: "no-email" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    console.warn(
      `[nieuwsbrief] geen DATABASE_URL — aanmelding niet opgeslagen (${email})`,
    );
  }

  return NextResponse.json({ ok: true });
}
