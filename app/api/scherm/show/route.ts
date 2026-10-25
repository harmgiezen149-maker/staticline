import { NextResponse } from "next/server";

import { formatDayMonth, formatYear } from "@/lib/i18n";
import type { ScreenShow } from "@/lib/screen";
import { getShows } from "@/lib/shows";
import { getSiteCopy } from "@/lib/site-content";

/**
 * De volgende show, voor het beeld "Volgende show" en de looptekst op /scherm.
 *
 * Uit dezelfde agenda als de site (getShows, met de cache van de Band App-
 * koppeling), al opgemaakt: het scherm hoeft niet met datums of tijdzones te
 * rekenen, en de status staat er in woorden bij. `null` als er niets gepland
 * staat. Een draaiend scherm vraagt dit om de minuut, en alleen als het ergens
 * gebruikt wordt.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const [{ next }, copy] = await Promise.all([getShows(), getSiteCopy("nl")]);
  const show: ScreenShow | null = next
    ? {
        name: next.title ?? next.venue,
        date: `${formatDayMonth(next.date)}.${formatYear(next.date)}`,
        time: next.time ?? "",
        city: next.city,
        status: copy.status[next.status],
        soldout: next.status === "soldout",
      }
    : null;
  return NextResponse.json(show, { headers: { "Cache-Control": "no-store" } });
}
