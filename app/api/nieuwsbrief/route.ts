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

type Sql = NonNullable<ReturnType<typeof getDb>>;

/**
 * Opslaan, met het nieuwsverzoek erbij.
 *
 * Staat de kolom `news_request` er nog niet (de database is nog niet bijgewerkt
 * in /beheer/database), dan zonder: aanmelden hoort nooit te stranden op een
 * kolom die er later bij kwam.
 */
async function upsert(
  sql: Sql,
  {
    email,
    locale,
    token,
    wantsNews,
  }: { email: string; locale: string; token: string; wantsNews: boolean },
) {
  const keepToken = `CASE WHEN newsletter_subscribers.confirmed_at IS NULL
                          THEN EXCLUDED.token ELSE newsletter_subscribers.token END`;
  try {
    return (await sql.query(
      `INSERT INTO newsletter_subscribers (email, locale, token, news_request)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET token = ${keepToken},
             locale = EXCLUDED.locale,
             news_request = COALESCE(EXCLUDED.news_request, newsletter_subscribers.news_request)
       RETURNING token`,
      [email, locale, token, wantsNews ? true : null],
    )) as { token: string }[];
  } catch {
    return (await sql.query(
      `INSERT INTO newsletter_subscribers (email, locale, token)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET token = ${keepToken}, locale = EXCLUDED.locale
       RETURNING token`,
      [email, locale, token],
    )) as { token: string }[];
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "onbekend";

  if (!allow(ip)) {
    return NextResponse.json({ error: "too-many" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  // Een bot krijgt hetzelfde antwoord als een mens.
  if (String(body.website ?? "").trim()) return NextResponse.json({ ok: true });

  const email = String(body.email ?? "")
    .trim()
    .slice(0, 160)
    .toLowerCase();
  if (!looksLikeEmail(email)) {
    return NextResponse.json({ error: "no-email" }, { status: 400 });
  }

  const wantsNews = body.news === true;

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

  const fresh = randomBytes(24).toString("base64url");
  let token = fresh;

  try {
    // Nog eens aanmelden met hetzelfde adres is geen fout. Is het nog niet
    // bevestigd, dan komt er een nieuwe sleutel, zodat een oude
    // bevestigingsmail niet meer werkt. Is het wél bevestigd, dan blijft de
    // sleutel staan: die zit in de afmeldlink van elke mail die al verstuurd is,
    // en die links horen te blijven werken.
    //
    // Het vinkje voor ander nieuws gaat niet meteen aan, maar in `news_request`:
    // het telt pas als de bevestigingslink aangeklikt is (lib/newsletter.ts).
    // Anders kan iedereen met jouw adres je nieuws aanzetten. Zonder vinkje
    // verandert er niets: wie nieuws al aan heeft, houdt het aan.
    const rows = await upsert(sql, { email, locale, token: fresh, wantsNews });
    token = rows[0]?.token ?? fresh;
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
