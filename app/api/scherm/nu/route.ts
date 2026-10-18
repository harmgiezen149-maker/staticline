import { NextResponse } from "next/server";

import { fetchNowPlaying } from "@/lib/band-app";

/**
 * Het nummer dat de band nu speelt, voor het beeld "Nu speelt" op /scherm.
 *
 * Een doorgeefluik naar /api/public/live van de Band App (zie fetchNowPlaying),
 * zodat het scherm alleen met deze site praat. Een draaiend scherm vraagt dit
 * om de paar seconden, en alleen als er een nu-speelt-beeld in de lijst staat.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await fetchNowPlaying(), { headers: { "Cache-Control": "no-store" } });
}
