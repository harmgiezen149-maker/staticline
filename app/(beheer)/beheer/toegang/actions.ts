"use server";

import { revalidatePath } from "next/cache";

import { type Role, cleanEmail, isFixed } from "@/lib/portal/access";
import { log } from "@/lib/portal/audit";
import { getSession } from "@/lib/portal/session";
import { removeUser, setUser } from "@/lib/portal/users";

export type AccessResult = { ok: boolean; message: string };

/**
 * Toegang geven, de rol wijzigen en toegang intrekken.
 *
 * Alleen een beheerder, en dat wordt hier gecontroleerd en niet alleen op de
 * pagina: een server action is een eigen adres. Adressen die vast in Vercel
 * staan, zijn hier niet aan te passen (zie lib/portal/users.ts); zo blijft er
 * altijd een beheerder over die erin kan.
 */
async function admin() {
  const session = await getSession();
  if (!session) return { error: "Je bent uitgelogd.", session: null };
  if (session.role !== "admin") return { error: "Alleen een beheerder kan toegang geven of intrekken.", session: null };
  return { error: null, session };
}

const roleOf = (v: unknown): Role | null => (v === "admin" || v === "member" ? v : null);
const label = (r: Role) => (r === "admin" ? "beheerder" : "lid");

export async function grant(email: string, role: string): Promise<AccessResult> {
  const { error, session } = await admin();
  if (error || !session) return { ok: false, message: error ?? "" };

  const address = cleanEmail(email);
  const wanted = roleOf(role);
  if (!address) return { ok: false, message: "Dat is geen geldig e-mailadres." };
  if (!wanted) return { ok: false, message: "Kies lid of beheerder." };
  if (isFixed(address)) {
    return { ok: false, message: `${address} staat vast in Vercel en is daar aan te passen, niet hier.` };
  }

  if (!(await setUser(address, wanted, session.email))) {
    return { ok: false, message: "Opslaan mislukt. Is de database gekoppeld? Kijk anders in de logs van Vercel." };
  }
  await log({ actor: session.email, action: "access.grant", subject: address, detail: wanted });
  revalidatePath("/beheer/toegang");
  return { ok: true, message: `${address} is nu ${label(wanted)}. Inloggen kan op staticline.nl/beheer met dit adres.` };
}

export async function revoke(email: string): Promise<AccessResult> {
  const { error, session } = await admin();
  if (error || !session) return { ok: false, message: error ?? "" };

  const address = cleanEmail(email);
  if (!address) return { ok: false, message: "Dat is geen geldig e-mailadres." };
  if (isFixed(address)) {
    return { ok: false, message: `${address} staat vast in Vercel en is daar aan te passen, niet hier.` };
  }

  if (!(await removeUser(address))) {
    return { ok: false, message: "Intrekken mislukt. Kijk in de logs van Vercel." };
  }
  await log({ actor: session.email, action: "access.revoke", subject: address });
  revalidatePath("/beheer/toegang");
  return { ok: true, message: `${address} heeft geen toegang meer.` };
}
