import { NextResponse } from "next/server";

import { loadScreen } from "@/lib/screen-store";

/**
 * De instelling van het scherm, voor een scherm dat al draait.
 *
 * /scherm vraagt dit elke tien seconden op. Zo komt een wijziging in /beheer/scherm
 * ook op de beamer die al de hele avond aanstaat, zonder dat iemand naar de
 * laptop naast het podium hoeft. Openbaar, net als /scherm zelf: er staat niets
 * in wat niet ook op het scherm te zien is.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await loadScreen();
  return NextResponse.json(config, { headers: { "Cache-Control": "no-store" } });
}
