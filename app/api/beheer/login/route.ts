import { NextResponse } from "next/server";

import { portalConfigured } from "@/lib/portal/access";
import { requestLink } from "@/lib/portal/login";

/**
 * Een inloglink aanvragen.
 *
 * Geeft altijd `{ ok: true }`, ongeacht of het adres bestaat, of het mag
 * inloggen, of de mail aankwam. Wie hier adressen langsstuurt om te zien wie er
 * in de band zit, krijgt op elk adres hetzelfde antwoord.
 *
 * De enige uitzondering is een portaal dat helemaal niet ingesteld is. Dat is
 * geen informatie over een persoon, en zonder die melding zou jij als beheerder
 * naar een mail zitten wachten die nooit verstuurd is.
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
    // Onleesbare invoer krijgt hetzelfde antwoord als de rest.
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "onbekend";

  await requestLink(email, ip);

  return NextResponse.json({ ok: true });
}
