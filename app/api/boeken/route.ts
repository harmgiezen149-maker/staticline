import { NextResponse } from "next/server";

import { getCopy } from "@/content";
import { bookingToText, readBooking, type Booking } from "@/lib/booking";
import { getDb } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { sendMail } from "@/lib/mail";
import { makeLimiter } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

/**
 * Een boekingsaanvraag of algemene vraag.
 *
 * Wat er met een aanvraag gebeurt, in deze volgorde:
 *
 * 1. Honeypot en snelheidsbegrenzer — voor er iets gebeurt.
 * 2. Captcha, als Turnstile ingesteld is.
 * 3. Doorsturen naar /api/booking van de Band App. Die slaat hem op als
 *    BookingRequest én stuurt een pushmelding naar de telefoons van de band. Dat
 *    is de belangrijkste stap: zo ziet de band hem waar ze toch al kijken.
 * 4. Opslaan in de eigen database van de website. Daar staat de volledige,
 *    gestructureerde aanvraag met alle elf velden — de Band App kent er zes. Is
 *    er geen database ingesteld, dan wordt dit overgeslagen met een logregel.
 * 5. Bevestigingsmail naar de afzender, in zijn eigen taal.
 *
 * Stap 3 en 4 zijn los van elkaar: mislukt het doorsturen, dan wordt de aanvraag
 * nog steeds opgeslagen. Andersom ook. Een aanvraag die maar half aankomt is
 * beter dan een aanvraag die verdwijnt.
 *
 * Stap 5 telt helemaal niet mee voor het antwoord aan de bezoeker. Die heeft zijn
 * aanvraag verstuurd; of onze mailprovider het aankan is niet zijn probleem, en
 * hij ziet de bevestiging al op het scherm staan.
 */
export const dynamic = "force-dynamic";

const BAND_APP_URL = (
  process.env.BAND_APP_URL || "https://static-line-bandapp.vercel.app"
).replace(/\/$/, "");

// Vijf per uur per afzender. Zie lib/rate-limit.ts voor waarom dit een drempel is
// en geen muur.
const allow = makeLimiter({ max: 5, windowMs: 60 * 60 * 1000 });

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
  const result = readBooking(body);

  // Een bot krijgt hetzelfde antwoord als een mens. Zou hij een foutmelding
  // krijgen, dan weet degene die hem schreef meteen welk veld hij moet leeglaten.
  if ("error" in result) {
    if (result.error === "bot") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const booking = result.data;

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "captcha" }, { status: 400 });
  }

  // Het id dat de Band App teruggeeft gaat mee de database in. Daarmee praten
  // de twee schermen daarna over dezelfde aanvraag en kan de stand op één plek
  // staan; zie lib/portal/booking-sync.ts.
  const bandAppId = await forwardToBandApp(booking);
  const stored = await store(booking, bandAppId);

  // Alleen als allebei mislukt is, is de aanvraag echt weg. Dan hoort de
  // bezoeker dat te weten, zodat hij kan mailen in plaats van te denken dat het
  // gelukt is.
  if (bandAppId === null && !stored) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const rawLocale = String(body.locale ?? "");
  await confirmToSender(booking, isLocale(rawLocale) ? rawLocale : "nl");

  return NextResponse.json({ ok: true });
}

/**
 * Doorsturen naar de Band App.
 *
 * Dit is de stap die telt voor de band: daar krijgen ze de pushmelding. Gooit
 * niet, maar meldt of het gelukt is — de aanroeper beslist wat dat betekent.
 *
 * Geeft het id terug dat de aanvraag daar gekregen heeft, of `null` als het niet
 * gelukt is. Dat id is de koppeling tussen de twee kopieën: zonder komt de stand
 * er weer los van te staan, en dat was precies het probleem.
 */
async function forwardToBandApp(booking: Booking): Promise<number | null> {
  try {
    const res = await fetch(`${BAND_APP_URL}/api/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        // `wanted` is bij hen bewust tekst en geen datum, omdat "ergens in mei"
        // bruikbare informatie is die een datumveld zou weggooien.
        wanted: booking.date,
        kind:
          booking.kind === "booking" ? booking.eventType || "boeking" : "vraag",
        message: bookingToText(booking),
      }),
    });

    if (!res.ok) {
      console.error(`[boeken] de Band App gaf ${res.status}`);
      return null;
    }

    const data = (await res.json().catch(() => ({}))) as { id?: unknown };
    const id = Number(data.id);
    // Een oudere Band App geeft alleen `{ ok: true }` terug. Dan is de aanvraag
    // daar wel aangekomen — dat is het belangrijkste — maar is er niets om aan
    // te koppelen, en houdt deze site zijn eigen stand bij.
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch (error) {
    console.error("[boeken] de Band App is niet bereikbaar:", error);
    return null;
  }
}

/** De volledige aanvraag opslaan. Geeft false als er geen database is of het misging. */
async function store(booking: Booking, bandAppId: number | null): Promise<boolean> {
  const sql = getDb();

  if (!sql) {
    console.warn(
      "[boeken] geen DATABASE_URL — aanvraag alleen doorgestuurd, niet opgeslagen",
    );
    return false;
  }

  try {
    await sql`
      INSERT INTO booking_submissions
        (kind, name, email, phone, wanted_date, location, wanted_time, duration,
         event_type, budget, room_size, parking, backstage, pa, message,
         forwarded, band_app_id)
      VALUES
        (${booking.kind}, ${booking.name}, ${booking.email}, ${booking.phone},
         ${booking.date}, ${booking.location}, ${booking.time}, ${booking.duration},
         ${booking.eventType}, ${booking.budget}, ${booking.roomSize},
         ${booking.parking}, ${booking.backstage}, ${booking.pa},
         ${booking.message}, ${bandAppId !== null}, ${bandAppId})
    `;
    return true;
  } catch (error) {
    console.error("[boeken] opslaan mislukt:", error);
    return false;
  }
}

/**
 * Bevestiging aan degene die het formulier invulde.
 *
 * Met een kopie van wat hij instuurde erbij. Dat is niet alleen netjes: het is
 * het enige bewijs dat hij heeft van wat hij gevraagd heeft, en het geeft hem de
 * kans te zien dat hij een datum verkeerd heeft ingetikt.
 *
 * `reply_to` staat in lib/mail.ts op de echte mailbox van de band, dus een
 * antwoord op deze mail komt gewoon aan.
 */
async function confirmToSender(booking: Booking, locale: Locale) {
  const copy = getCopy(locale).mail;

  const lines = [
    copy.bookingGreeting.replace("{name}", booking.name),
    "",
    booking.kind === "booking" ? copy.bookingBooking : copy.bookingQuestion,
  ];

  const summary = bookingToText(booking).trim();
  if (summary) {
    lines.push("", copy.bookingCopy, "", ...summary.split("\n"));
  }

  lines.push("", copy.signature);

  await sendMail({
    to: booking.email,
    subject: copy.bookingSubject,
    lines,
  });
}
