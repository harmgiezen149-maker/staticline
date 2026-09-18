"use server";

import { revalidatePath } from "next/cache";

import { log } from "@/lib/portal/audit";
import { getSession } from "@/lib/portal/session";
import { remove } from "@/lib/portal/subscribers";

export type RemoveState = { ok: boolean; message: string } | null;

/**
 * Iemand handmatig afmelden.
 *
 * Alleen een beheerder. De controle staat hier en niet alleen op de pagina: een
 * server action is een eigen adres dat aangeroepen kan worden zonder dat de
 * pagina eromheen ooit getoond is.
 */
export async function removeSubscriber(
  _previous: RemoveState,
  formData: FormData,
): Promise<RemoveState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Je bent uitgelogd." };
  if (session.role !== "admin") {
    return { ok: false, message: "Alleen een beheerder kan iemand afmelden." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, message: "Onbekende aanmelding." };
  }

  const email = await remove(id);
  if (!email) {
    return { ok: false, message: "Afmelden mislukt." };
  }

  await log({
    actor: session.email,
    action: "newsletter.remove",
    subject: String(id),
    detail: email,
  });

  revalidatePath("/beheer/nieuwsbrief");
  return { ok: true, message: `${email} is afgemeld.` };
}
