import { NextResponse } from "next/server";

import { authorized } from "@/lib/portal/api-token";
import { log } from "@/lib/portal/audit";
import { makeLimiter } from "@/lib/rate-limit";
import {
  MAX_BRIEF_CHARS,
  MAX_INPUT_CHARS,
  TEXT_TYPES,
  textTypeById,
} from "@/lib/tov/config";
import { parseRequest } from "@/lib/tov/request";
import { runTov } from "@/lib/tov/run";
import { loadSourceOptions } from "@/lib/tov/sources";

/**
 * De schrijfmodule, ook bruikbaar vanuit de Band App.
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

/**
 * Waar de Band App zijn scherm mee vult.
 *
 * De teksttypen met hun bronnen, en de keuzelijsten voor leden en shows. Die
 * lijsten komen uit dezelfde Band App, maar wel via deze kant: dan staan de
 * datums in beide schermen in dezelfde opmaak en op dezelfde tijdzone, en is er
 * één plek waar dat fout kan gaan in plaats van twee.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const options = await loadSourceOptions().catch(() => null);

  return NextResponse.json({
    maxInputChars: MAX_INPUT_CHARS,
    maxBriefChars: MAX_BRIEF_CHARS,
    textTypes: TEXT_TYPES.map(({ id, label, maxWords, maxWordsLong, hint, sources, subject }) => ({
      id,
      label,
      maxWords,
      maxWordsLong,
      hint,
      sources,
      subject,
    })),
    options: options ?? { members: [], upcoming: [], past: [], available: false },
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "onleesbaar" }, { status: 400 });
  }

  // Wie het vraagt, zoals de Band App hem kent. Alleen om te begrenzen en te
  // loggen; er gaat geen tekst het logboek in.
  const actor = String(body.actor ?? "bandapp").trim().slice(0, 160) || "bandapp";

  const type = textTypeById(String(body.textType ?? ""));
  if (!type) return NextResponse.json({ error: "onbekend-type" }, { status: 400 });

  const parsed = parseRequest(body, {
    maxInputChars: MAX_INPUT_CHARS,
    maxBriefChars: MAX_BRIEF_CHARS,
  });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (!perPersoon(`bandapp:${actor}`)) {
    return NextResponse.json({ error: "too-many" }, { status: 429 });
  }

  const result = await runTov(parsed.value, type);
  if (!result.ok) {
    const status = result.error === "not-configured" || result.error === "no-tov" ? 503 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  await log({
    actor: `bandapp:${actor}`,
    action: parsed.value.mode === "brief" ? "tov.write" : "tov.rewrite",
    subject: type.id,
    detail: `tone of voice ${result.version}, ${result.nl.wordCount}/${result.en.wordCount} woorden`,
  });

  return NextResponse.json({
    nl: result.nl,
    en: result.en,
    flags: result.flags,
  });
}
