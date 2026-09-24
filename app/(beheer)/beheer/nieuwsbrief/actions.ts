"use server";

import { revalidatePath } from "next/cache";

import { announce, findShow, preview, setAuto, skip } from "@/lib/announce";
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

export type AnnounceState = { ok: boolean; message: string } | null;

/**
 * De knoppen bij een show: voorbeeld naar jezelf, nu versturen, overslaan.
 *
 * Eén actie met een `intent` in plaats van drie, omdat ze alle drie dezelfde
 * controles nodig hebben: ingelogd, beheerder, en een show die echt in de agenda
 * staat. Het id komt uit het formulier en wordt dus nooit vertrouwd zonder dat
 * de show er opnieuw bij gezocht wordt.
 */
export async function announceAction(
  _previous: AnnounceState,
  formData: FormData,
): Promise<AnnounceState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Je bent uitgelogd." };
  if (session.role !== "admin") {
    return { ok: false, message: "Alleen een beheerder kan dit." };
  }

  const show = await findShow(Number(formData.get("id")));
  if (!show)
    return { ok: false, message: "Deze show staat niet (meer) in de agenda." };

  const intent = String(formData.get("intent"));

  if (intent === "preview") {
    const ok = await preview(show, session.email);
    return ok
      ? { ok: true, message: `Voorbeeld gestuurd naar ${session.email}.` }
      : {
          ok: false,
          message: "Voorbeeld niet verstuurd. Staat RESEND_API_KEY bij Vercel?",
        };
  }

  if (intent === "skip") {
    const ok = await skip(show, session.email);
    revalidatePath("/beheer/nieuwsbrief");
    return ok
      ? {
          ok: true,
          message: "Overgeslagen. Deze show gaat niet naar de nieuwsbrief.",
        }
      : { ok: false, message: "Niet gelukt. Is hij misschien al verstuurd?" };
  }

  if (intent === "send") {
    const result = await announce(show, session.email);
    revalidatePath("/beheer/nieuwsbrief");
    if (result.ok) {
      return {
        ok: true,
        message: `Verstuurd naar ${result.recipients} adressen.`,
      };
    }
    const why = {
      "no-db": "Er is geen database gekoppeld.",
      busy: "Hij wordt op dit moment al verstuurd.",
      done: "Deze show is al verstuurd.",
      "unknown-show": "Deze show staat niet (meer) in de agenda.",
      failed:
        "Versturen mislukt. Staat RESEND_API_KEY bij Vercel? Je kunt het opnieuw proberen.",
    }[result.reason];
    return { ok: false, message: why };
  }

  return { ok: false, message: "Onbekende actie." };
}

/** Automatisch versturen aan of uit. */
export async function toggleAuto(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") return;
  await setAuto(formData.get("on") === "1", session.email);
  revalidatePath("/beheer/nieuwsbrief");
}
