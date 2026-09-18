import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { getCopy } from "@/content";
import { looksLikeEmail } from "@/lib/booking";
import { getDb } from "@/lib/db";
import { isLocale, localePath } from "@/lib/i18n";
import { sendMail } from "@/lib/mail";
import { makeLimiter } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site";

/**
 * Aanmelding voor de nieuwsbrief.
 *
 * Met dubbele opt-in, en dat is geen formaliteit: zonder bevestigingsstap kan
 * iemand anders jouw adres invullen, en dan stuurt de band ongevraagde mail naar
 * een vreemde. De aanmelding wordt opgeslagen met `confirmed_at` leeg; pas na een
 * klik op de link uit de bevestigingsmail telt hij mee.
 *
 * De bevestigingsmail gaat via Resend, in de taal waarin iemand zich aanmeldde.
 * De link erin komt uit op /nieuwsbrief/bevestigen, een echte pagina — een link
 * in een mail wordt door een mens aangeklikt en die hoort geen JSON te zien.
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

  const copy = getCopy(locale).mail;
  const link = `${siteUrl()}${localePath(locale, "/nieuwsbrief/bevestigen")}?token=${token}`;

  // Of de mail aankomt bepaalt het antwoord niet: de aanmelding staat al in de
  // database. Mislukt hij, dan meldt lib/mail.ts dat in het log en kan dezelfde
  // persoon het zo opnieuw proberen — dat levert een nieuwe sleutel op.
  await sendMail({
    to: email,
    subject: copy.newsletterSubject,
    lines: [
      copy.newsletterGreeting,
      "",
      copy.newsletterBody,
      "",
      link,
      "",
      copy.newsletterIgnore,
      "",
      copy.signature,
    ],
  });

  return NextResponse.json({ ok: true });
}
