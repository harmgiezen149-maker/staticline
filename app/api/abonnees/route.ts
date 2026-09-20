import { NextResponse } from "next/server";

import { authorized } from "@/lib/portal/api-token";
import { log } from "@/lib/portal/audit";
import { list, remove } from "@/lib/portal/subscribers";

/**
 * De nieuwsbriefabonnees, ook bruikbaar vanuit de Band App.
 *
 * Dezelfde opzet als /api/tov: de gegevens en de regels staan hier, de Band App
 * heeft een scherm dat dit adres aanroept. De abonnees staan in de database van
 * déze site — dat is website-gegeven, met een dubbele opt-in en een afmeldlink
 * die uit de mails van deze site komt — en dat blijft zo. Alleen het scherm
 * verhuist, niet de gegevens.
 *
 * Wie de sleutel heeft, ís de Band App. Wélk bandlid er achter zit, wordt daar
 * bepaald: die app kent zijn eigen sessie en weet wie beheerder is. Het adres
 * komt hier mee voor het logboek, precies zoals bij /api/tov.
 */
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

/** Wie de aanroep deed, voor het logboek. Nooit vertrouwd voor rechten. */
function actorOf(value: unknown): string {
  return String(value ?? "bandapp").trim().slice(0, 160) || "bandapp";
}

/** De hele lijst, inclusief de onbevestigde. */
export async function GET(request: Request) {
  if (!authorized(request)) return deny();

  const subscribers = await list();

  return NextResponse.json({
    subscribers,
    // Zodat het scherm "nog niemand" kan onderscheiden van "geen database".
    // Zonder DATABASE_URL geeft `list()` een lege array, en dat is iets anders
    // dan een lege lijst.
    available: Boolean(process.env.DATABASE_URL?.trim()),
  });
}

/**
 * Iemand afmelden.
 *
 * Echt verwijderen en geen vlaggetje — zie lib/portal/subscribers.ts. Eén actie
 * en geen DELETE op een eigen adres per abonnee: het is er één, en dan is een
 * extra bestand met een dynamisch segment meer werk dan het oplevert.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return deny();

  const body = await request.json().catch(() => ({}));
  if (body?.action !== "remove") {
    return NextResponse.json({ error: "unknown-action" }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }

  const email = await remove(id);
  if (!email) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  await log({
    actor: `bandapp:${actorOf(body.actor)}`,
    action: "newsletter.remove",
    subject: String(id),
    detail: email,
  });

  return NextResponse.json({ ok: true, email });
}
