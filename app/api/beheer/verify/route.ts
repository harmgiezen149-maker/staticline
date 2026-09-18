import { NextResponse } from "next/server";

import { consume } from "@/lib/portal/login";
import { startSession } from "@/lib/portal/session";
import { siteUrl } from "@/lib/site";

/**
 * De link uit de mail.
 *
 * Een route handler en geen pagina, omdat hier een koekje gezet wordt: dat kan
 * niet tijdens het renderen van een server component. Zie de Next-documentatie
 * bij `cookies` — zetten en verwijderen mag alleen in een server action of een
 * route handler.
 *
 * Bij elke uitkomst een omleiding naar een scherm dat uitlegt wat er aan de hand
 * is. Een bezoeker die op een link in zijn mail klikt, hoort geen JSON te zien.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const result = await consume(token);

  const to = (path: string) => NextResponse.redirect(new URL(path, siteUrl()));

  if (!result.ok) return to(`/beheer/login?fout=${result.reason}`);

  const started = await startSession(result.email);
  if (!started) return to("/beheer/login?fout=error");

  return to("/beheer");
}
