import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { log } from "@/lib/portal/audit";
import { makeLimiter } from "@/lib/rate-limit";
import { MAX_INPUT_CHARS, TEXT_TYPES, textTypeById } from "@/lib/tov/config";
import { rewrite } from "@/lib/tov/rewrite";

/**
 * De herschrijfmodule, ook bruikbaar vanuit de Band App.
 *
 * Eén implementatie voor twee schermen. De tone of voice, de lengtelimieten en
 * de blocklist staan hier; de Band App heeft een pagina die dit adres aanroept.
 * Zo is er één bestand om de toon in bij te stellen en één API-sleutel om te
 * beheren — het overdrachtsdocument waarschuwt er zelf voor dat de blocklist en
 * de checklist anders uit de pas gaan lopen met de tone of voice.
 *
 * Dezelfde gedeelde sleutel als de schrijfroute de andere kant op: `/api/site`
 * in de Band App gebruikt hem om de website te herkennen, deze route om de Band
 * App te herkennen. Twee partijen, één geheim, allebei de kanten op.
 *
 * Dicht zolang SITE_API_TOKEN niet staat. Een route die betaalde aanroepen doet
 * hoort niet open te staan omdat iemand vergeten is een waarde in te vullen.
 */
export const dynamic = "force-dynamic";

/** Per persoon, niet per aanroeper: anders verbruikt één bandlid de hele emmer. */
const perPersoon = makeLimiter({ max: 20, windowMs: 60 * 60 * 1000 });

function authorized(req: Request): boolean {
  const secret = process.env.SITE_API_TOKEN;
  if (!secret || secret.length < 32) return false;

  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Welke teksttypen er zijn, zodat de Band App zijn eigen keuzelijst kan vullen. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    maxInputChars: MAX_INPUT_CHARS,
    textTypes: TEXT_TYPES.map(({ id, label, maxWords, hint }) => ({
      id,
      label,
      maxWords,
      hint,
    })),
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { text?: unknown; textType?: unknown; context?: unknown; actor?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "onleesbaar" }, { status: 400 });
  }

  const input = String(body.text ?? "").trim();
  const context = String(body.context ?? "").trim().slice(0, 1000);
  // Wie het vraagt, zoals de Band App hem kent. Alleen om te begrenzen en te
  // loggen; er gaat geen tekst het logboek in.
  const actor = String(body.actor ?? "bandapp").trim().slice(0, 160) || "bandapp";

  if (!input) return NextResponse.json({ error: "geen-tekst" }, { status: 400 });
  if (input.length > MAX_INPUT_CHARS) {
    return NextResponse.json({ error: "te-lang" }, { status: 400 });
  }

  const type = textTypeById(String(body.textType ?? ""));
  if (!type) return NextResponse.json({ error: "onbekend-type" }, { status: 400 });

  if (!perPersoon(`bandapp:${actor}`)) {
    return NextResponse.json({ error: "too-many" }, { status: 429 });
  }

  const result = await rewrite({ input, type, context });
  if (!result.ok) {
    const status = result.error === "not-configured" || result.error === "no-tov" ? 503 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  await log({
    actor: `bandapp:${actor}`,
    action: "tov.rewrite",
    subject: type.id,
    detail: `tone of voice ${result.version}, ${result.nl.wordCount}/${result.en.wordCount} woorden`,
  });

  return NextResponse.json({
    nl: result.nl,
    en: result.en,
    flags: result.flags,
  });
}
