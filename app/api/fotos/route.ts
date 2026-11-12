import { NextResponse } from "next/server";

import { authorized } from "@/lib/portal/api-token";
import { addSitePhoto, listSitePhotos, removeSitePhoto } from "@/lib/portal/photos";

/**
 * De foto's op de site, voor de Band App ("Foto's op de website" daar).
 *
 * Dezelfde opzet als /api/abonnees: wie de sleutel heeft, ís de Band App, en die
 * bepaalt welk bandlid wat mag. De regels zelf (alleen de eigen opslag, altijd
 * een beschrijving, bij verwijderen ook het bestand weg) staan in
 * lib/portal/photos.ts, dezelfde als in /beheer/inhoud. Het uploaden gaat langs
 * /api/fotos/upload.
 */
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
const noStore = { "Cache-Control": "no-store" };

/** Wie de aanroep deed, voor het logboek. Nooit vertrouwd voor rechten. */
const actorOf = (value: unknown) => String(value ?? "bandapp").trim().slice(0, 160) || "bandapp";

export async function GET(request: Request) {
  if (!authorized(request)) return deny();
  return NextResponse.json(
    { photos: await listSitePhotos(), available: Boolean(process.env.DATABASE_URL?.trim()) },
    { headers: noStore },
  );
}

/** `{ action: "add", url, alt, caption, actor }` of `{ action: "remove", id, actor }`. */
export async function POST(request: Request) {
  if (!authorized(request)) return deny();

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const actor = actorOf(body.actor);
  const result =
    body.action === "add"
      ? await addSitePhoto({ url: body.url, alt: body.alt, caption: body.caption }, actor)
      : body.action === "remove"
        ? await removeSitePhoto(Number(body.id), actor)
        : null;
  if (!result) return NextResponse.json({ error: "unknown-action" }, { status: 400 });

  return NextResponse.json(
    { ...result, photos: await listSitePhotos() },
    { status: result.ok ? 200 : 400, headers: noStore },
  );
}
