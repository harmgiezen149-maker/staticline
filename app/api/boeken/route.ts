import { NextResponse } from "next/server";

import { bookingToText, readBooking, type Booking } from "@/lib/booking";
import { getDb } from "@/lib/db";
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
 * 5. Bevestigingsmail naar de afzender, zodra mail ingesteld is.
 *
 * Stap 3 en 4 zijn los van elkaar: mislukt het doorsturen, dan wordt de aanvraag
 * nog steeds opgeslagen. Andersom ook. Een aanvraag die maar half aankomt is
 * beter dan een aanvraag die verdwijnt.
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

  const forwarded = await forwardToBandApp(booking);
  const stored = await store(booking, forwarded);

  // Alleen als allebei mislukt is, is de aanvraag echt weg. Dan hoort de
  // bezoeker dat te weten, zodat hij kan mailen in plaats van te denken dat het
  // gelukt is.
  if (!forwarded && !stored) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  // TODO zodra er een mailkoppeling is: bevestiging naar de afzender. Tot die
  // tijd ziet die alleen de bevestiging op het scherm.
  if (!process.env.SMTP_USER && !process.env.RESEND_API_KEY) {
    console.warn("[boeken] geen mailkoppeling — geen bevestiging verstuurd");
  }

  return NextResponse.json({ ok: true });
}

/**
 * Doorsturen naar de Band App.
 *
 * Dit is de stap die telt voor de band: daar krijgen ze de pushmelding. Gooit
 * niet, maar meldt of het gelukt is — de aanroeper beslist wat dat betekent.
 */
async function forwardToBandApp(booking: Booking): Promise<boolean> {
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
      return false;
    }
    return true;
  } catch (error) {
    console.error("[boeken] de Band App is niet bereikbaar:", error);
    return false;
  }
}

/** De volledige aanvraag opslaan. Geeft false als er geen database is of het misging. */
async function store(booking: Booking, forwarded: boolean): Promise<boolean> {
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
         event_type, budget, room_size, parking, backstage, pa, message, forwarded)
      VALUES
        (${booking.kind}, ${booking.name}, ${booking.email}, ${booking.phone},
         ${booking.date}, ${booking.location}, ${booking.time}, ${booking.duration},
         ${booking.eventType}, ${booking.budget}, ${booking.roomSize},
         ${booking.parking}, ${booking.backstage}, ${booking.pa},
         ${booking.message}, ${forwarded})
    `;
    return true;
  } catch (error) {
    console.error("[boeken] opslaan mislukt:", error);
    return false;
  }
}
