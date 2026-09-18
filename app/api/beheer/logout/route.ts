import { NextResponse } from "next/server";

import { endSession } from "@/lib/portal/session";
import { siteUrl } from "@/lib/site";

/**
 * Uitloggen.
 *
 * Alleen via POST. Met een GET zou elke afbeelding of link naar dit adres —
 * ook eentje die iemand anders ergens neerzet — je stil uitloggen.
 */
export async function POST() {
  await endSession();
  return NextResponse.redirect(new URL("/beheer/login?uit=1", siteUrl()), {
    // 303, zodat de browser de omleiding met GET volgt in plaats van de POST
    // te herhalen.
    status: 303,
  });
}
