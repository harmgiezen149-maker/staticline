import { NextResponse } from "next/server";

import { bookingToText, readBooking } from "@/lib/booking";
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
 * 4. Opslaan in de eigen database van de website, zodra die er is. Dan staat de
 *    volledige, gestructureerde aanvraag ook hier — de Band App kent maar zes
 *    velden, dit formulier heeft er elf.
 * 5. Bevestigingsmail naar de afzender, zodra mail ingesteld is.
 *
 * Stap 4 en 5 bestaan nog niet en worden overgeslagen met een logregel. De
 * aanvraag komt dus hoe dan ook aan, ook zonder database en zonder mailsleutels.
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

  // Doorsturen naar de Band App. Dit is de stap die telt: daar krijgt de band de
  // melding op de telefoon.
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
        kind: booking.kind === "booking" ? booking.eventType || "boeking" : "vraag",
        message: bookingToText(booking),
      }),
    });

    if (!res.ok) {
      console.error(`[boeken] de Band App gaf ${res.status}`);
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
  } catch (error) {
    console.error("[boeken] de Band App is niet bereikbaar:", error);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  // TODO zodra de eigen Neon-database aan het Vercel-project hangt: hier de
  // volledige aanvraag opslaan, met alle elf velden en een afgehandeld-vlag.
  // docs/03-data-model.md noemt dat `booking_submissions`.
  if (!process.env.DATABASE_URL) {
    console.warn(
      "[boeken] geen DATABASE_URL — aanvraag alleen doorgestuurd, niet opgeslagen",
    );
  }

  // TODO zodra er een mailkoppeling is: bevestiging naar de afzender. Tot die
  // tijd ziet die alleen de bevestiging op het scherm.
  if (!process.env.SMTP_USER && !process.env.RESEND_API_KEY) {
    console.warn("[boeken] geen mailkoppeling — geen bevestiging verstuurd");
  }

  return NextResponse.json({ ok: true });
}
