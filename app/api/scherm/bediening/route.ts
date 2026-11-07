import { NextResponse } from "next/server";

import { authorized } from "@/lib/portal/api-token";
import { applyRemote, remoteView } from "@/lib/screen-remote";
import { loadScreen, storeScreen } from "@/lib/screen-store";

/**
 * De snelbediening van het scherm, voor de Band App.
 *
 * Dezelfde opzet als /api/abonnees en /api/tov: wie de sleutel heeft, ís de
 * Band App, en die bepaalt zelf welk bandlid er achter zit. Wat er mag
 * veranderen en binnen welke grenzen staat in lib/screen-remote.ts; foto's,
 * formaat en hulplijnen blijven in /beheer/scherm.
 */
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
const noStore = { "Cache-Control": "no-store" };

/** Wie de aanroep deed, voor het logboek. Nooit vertrouwd voor rechten. */
const actorOf = (value: unknown) => String(value ?? "bandapp").trim().slice(0, 160) || "bandapp";

export async function GET(request: Request) {
  if (!authorized(request)) return deny();
  return NextResponse.json(remoteView(await loadScreen({ fresh: true })), { headers: noStore });
}

/** `{ patch, actor }`; zie applyRemote voor wat er in `patch` mag. */
export async function POST(request: Request) {
  if (!authorized(request)) return deny();

  const body = (await request.json().catch(() => null)) as { patch?: unknown; actor?: unknown } | null;
  if (!body || typeof body.patch !== "object" || body.patch === null) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const config = applyRemote(await loadScreen({ fresh: true }), body.patch);
  const keys = Object.keys(body.patch).join(", ").slice(0, 120);
  if (!(await storeScreen(config, actorOf(body.actor), `via de Band App: ${keys}`))) {
    return NextResponse.json({ error: "not-saved" }, { status: 503 });
  }
  return NextResponse.json(remoteView(config), { headers: noStore });
}
