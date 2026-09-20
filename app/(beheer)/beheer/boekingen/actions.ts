"use server";

import { revalidatePath } from "next/cache";

import { pushStatus } from "@/lib/portal/booking-sync";
import { type Status, isStatus } from "@/lib/portal/booking-status";
import { get, update } from "@/lib/portal/bookings";
import { log } from "@/lib/portal/audit";
import { getSession } from "@/lib/portal/session";

export type SaveState = { ok: boolean; message: string } | null;

/**
 * De status en notitie van één aanvraag opslaan.
 *
 * De rechtencontrole staat hier, niet alleen op de pagina: een server action is
 * een eigen adres dat aangeroepen kan worden zonder dat de pagina eromheen ooit
 * getoond is. Zie de waarschuwing in de Next-documentatie bij formulieren.
 *
 * Een lid mag meekijken maar niet wijzigen — zo staat het in docs/01-scope.md.
 */
export async function saveBooking(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Je bent uitgelogd." };
  if (session.role !== "admin") {
    return { ok: false, message: "Alleen een beheerder kan dit wijzigen." };
  }

  const id = Number(formData.get("id"));
  const status = formData.get("status");
  const note = String(formData.get("note") ?? "").slice(0, 2000);

  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, message: "Onbekende aanvraag." };
  }
  if (!isStatus(status)) {
    return { ok: false, message: "Onbekende status." };
  }

  const booking = await get(id);
  if (!booking) {
    return { ok: false, message: "Onbekende aanvraag." };
  }

  /**
   * Eerst de Band App, dan pas hier.
   *
   * Daar staat de stand waar de band naar kijkt; deze site volgt. Andersom
   * opslaan zou opleveren wat deze koppeling juist moet voorkomen: een aanvraag
   * die hier op "geboekt" staat en daar nog op "nieuw".
   *
   * Is de aanvraag niet gekoppeld — nooit aangekomen, of binnengekomen voordat
   * deze koppeling bestond — dan is de stand hier de enige die er is, en wordt
   * hij hier gewoon opgeslagen.
   */
  if (booking.band_app_id !== null && status !== booking.status) {
    const pushed = await pushStatus(booking.band_app_id, status as Status);
    if (!pushed.ok) return { ok: false, message: pushed.message };
  }

  const saved = await update(id, status as Status, note, session.email);
  if (!saved) {
    return { ok: false, message: "Opslaan mislukt. Kijk in de logs van Vercel." };
  }

  await log({
    actor: session.email,
    action: "booking.update",
    subject: String(id),
    detail: `status ${status}${booking.band_app_id !== null ? ", ook in de Band App" : ""}`,
  });

  // De lijst en dit scherm tonen allebei de status, dus allebei verversen.
  revalidatePath("/beheer/boekingen");
  revalidatePath(`/beheer/boekingen/${id}`);

  return { ok: true, message: "Opgeslagen." };
}
