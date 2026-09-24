"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { announce, findShow, preview, setAuto, skip } from "@/lib/announce";
import { missing } from "@/lib/issue-mail";
import {
  deleteIssue,
  previewIssue,
  saveIssue,
  scheduleIssue,
  sendIssue,
} from "@/lib/issues";
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

export type IssueState = { ok: boolean; message: string } | null;

/**
 * Alles wat je met een nieuwsbrief in het schrijfscherm kunt doen.
 *
 * Elke knop slaat eerst op wat er in het formulier staat, en doet dan pas zijn
 * eigen ding. Zo stuurt "voorbeeld" of "versturen" altijd de tekst die je op je
 * scherm ziet, en niet de versie van de vorige keer opslaan.
 */
export async function issueAction(
  _previous: IssueState,
  formData: FormData,
): Promise<IssueState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Je bent uitgelogd." };
  if (session.role !== "admin") {
    return {
      ok: false,
      message: "Alleen een beheerder kan nieuwsbrieven versturen.",
    };
  }

  const intent = String(formData.get("intent"));
  const rawId = Number(formData.get("id"));
  const existing = Number.isInteger(rawId) && rawId > 0 ? rawId : undefined;
  const text = (name: string, max: number) =>
    String(formData.get(name) ?? "").slice(0, max);

  if (intent === "delete") {
    if (!existing) redirect("/beheer/nieuwsbrief");
    const ok = await deleteIssue(existing, session.email);
    if (!ok)
      return {
        ok: false,
        message: "Weggooien lukte niet. Is hij al verstuurd?",
      };
    revalidatePath("/beheer/nieuwsbrief");
    redirect("/beheer/nieuwsbrief");
  }

  const fields = {
    subject_nl: text("subject_nl", 200),
    body_nl: text("body_nl", 20_000),
    subject_en: text("subject_en", 200),
    body_en: text("body_en", 20_000),
    scheduled_for: null,
  };

  const id = await saveIssue(fields, session.email, existing);
  if (!id) {
    return {
      ok: false,
      message: existing
        ? "Opslaan lukte niet. Is hij al verstuurd?"
        : "Opslaan lukte niet. Staat de database-update erop?",
    };
  }
  revalidatePath("/beheer/nieuwsbrief");

  let result: IssueState = { ok: true, message: "Opgeslagen." };

  if (intent === "preview") {
    const ok = await previewIssue(fields, session.email);
    result = ok
      ? {
          ok: true,
          message: `Opgeslagen, en een voorbeeld gestuurd naar ${session.email}.`,
        }
      : {
          ok: false,
          message:
            "Opgeslagen, maar het voorbeeld ging niet weg. Staat RESEND_API_KEY bij Vercel?",
        };
  } else if (intent === "schedule" || intent === "send") {
    const problem = missing(fields);
    if (problem) {
      result = { ok: false, message: `Opgeslagen als concept. ${problem}` };
    } else if (intent === "schedule") {
      const date = text("scheduled_for", 10);
      const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Europe/Amsterdam",
      });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) {
        result = {
          ok: false,
          message: "Opgeslagen als concept. Kies een dag, vandaag of later.",
        };
      } else {
        const ok = await scheduleIssue(id, date, session.email);
        result = ok
          ? {
              ok: true,
              message: `Ingepland: gaat mee met de ochtendronde van ${date}.`,
            }
          : { ok: false, message: "Inplannen lukte niet." };
      }
    } else {
      const sent = await sendIssue(id, session.email);
      result = sent.ok
        ? { ok: true, message: `Verstuurd naar ${sent.recipients} adressen.` }
        : { ok: false, message: sent.message };
    }
    revalidatePath("/beheer/nieuwsbrief");
  }

  // Een nieuwe brief heeft nu een id; zonder die in het adres zou de volgende
  // klik er een tweede van maken.
  if (!existing)
    redirect(
      `/beheer/nieuwsbrief/schrijven?id=${id}&melding=${encodeURIComponent(result.message)}`,
    );
  revalidatePath("/beheer/nieuwsbrief/schrijven");
  return result;
}
