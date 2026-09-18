import { NextResponse } from "next/server";

import { portalConfigured } from "@/lib/portal/access";
import { requestLink } from "@/lib/portal/login";

/**
 * Een inloglink aanvragen.
 *
 * Een bekend en een onbekend adres geven allebei `{ ok: true }`. Wie hier
 * adressen langsstuurt om te zien wie er in de band zit, krijgt op elk adres
 * hetzelfde antwoord.
 *
 * Een storing is wél zichtbaar. Dat is geen informatie over een persoon, en
 * zonder die melding zit je naar een mail te wachten die nooit verstuurd is —
 * precies wat er gebeurde toen de tabellen nog niet bestonden.
 */
export async function POST(request: Request) {
  if (!portalConfigured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email === "string") email = body.email;
  } catch {
    // Onleesbare invoer krijgt hetzelfde antwoord als een onbekend adres.
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "onbekend";

  const result = await requestLink(email, ip);

  if (result === "rate-limited") {
    return NextResponse.json({ error: "too-many" }, { status: 429 });
  }
  if (result === "error") {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
