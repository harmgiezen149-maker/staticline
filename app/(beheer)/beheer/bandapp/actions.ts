"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { log } from "@/lib/portal/audit";
import { write } from "@/lib/portal/band-app-write";
import { getSession } from "@/lib/portal/session";

export type BandAppState = { ok: boolean; message: string } | null;

/**
 * Wijzigingen die naar de Band App gaan.
 *
 * Elke action controleert zelf op beheerdersrechten. Dat is niet dubbelop met de
 * pagina: een server action is een eigen adres dat aangeroepen kan worden zonder
 * dat de pagina eromheen ooit getoond is.
 *
 * De sleutel waarmee de Band App wordt aangeroepen staat in een
 * omgevingsvariabele en komt nooit in de browser. Daarom loopt dit via een action
 * en niet via een fetch vanuit het scherm.
 */
async function admin() {
  const session = await getSession();
  if (!session) return { error: "Je bent uitgelogd." as const, session: null };
  if (session.role !== "admin") {
    return { error: "Alleen een beheerder kan dit wijzigen." as const, session: null };
  }
  return { error: null, session };
}

/** Wat een foutcode uit de Band App betekent, in gewone taal. */
const REASONS: Record<string, string> = {
  "not-configured":
    "De koppeling is nog niet ingesteld. SITE_API_TOKEN moet bij beide projecten in Vercel staan, met dezelfde waarde.",
  unreachable: "De Band App is niet bereikbaar. Probeer het zo nog eens.",
  unauthorized:
    "De Band App wees de sleutel af. Staat SITE_API_TOKEN daar op dezelfde waarde?",
  "not-found": "Deze show bestaat daar niet (meer).",
  invalid: "Vul in elk geval een titel en een datum in.",
  "invalid-date": "Die datum kon niet gelezen worden.",
  "invalid-logo": "Een logo-adres moet met http:// of https:// beginnen.",
  "nothing-to-do": "Er was niets gewijzigd.",
  "no-band": "De Band App heeft nog geen band ingesteld.",
};

const explain = (error: string) =>
  REASONS[error] ?? `De Band App gaf een fout terug: ${error}`;

function refresh() {
  // De publieke agenda leest de Band App met deze tag; zie lib/band-app.ts, waar
  // het antwoord vijf minuten hergebruikt mag worden. Na een wijziging hier hoort
  // die vijf minuten niet te gelden — `{ expire: 0 }` betekent: geen oude versie
  // meer uitserveren, het eerstvolgende verzoek wacht op de nieuwe.
  revalidateTag("band-app", { expire: 0 });
  revalidatePath("/beheer/bandapp");
}

export async function saveBand(
  _previous: BandAppState,
  formData: FormData,
): Promise<BandAppState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();

  if (!name) return { ok: false, message: "De bandnaam mag niet leeg zijn." };

  const result = await write("band.update", { name, bio, logoUrl });
  if (!result.ok) return { ok: false, message: explain(result.error) };

  await log({ actor: session.email, action: "bandapp.band", detail: name });
  refresh();

  return { ok: true, message: "Opgeslagen in de Band App." };
}

/** De velden van een show, zoals het formulier ze stuurt. */
function gigFields(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    date: text("date"),
    time: text("time"),
    title: text("title"),
    venue: text("venue"),
    city: text("city"),
    publicStatus: text("publicStatus"),
    ticketUrl: text("ticketUrl"),
    publicNote: text("publicNote"),
    // Altijd meesturen, ook leeg. Een leeg veld betekent hier "haal de speld van
    // de kaart"; weglaten zou betekenen "laat staan wat er stond", en dan kun je
    // een verkeerd gezette speld nooit meer kwijt.
    lat: text("lat"),
    lng: text("lng"),
  };
}

export async function createGig(
  _previous: BandAppState,
  formData: FormData,
): Promise<BandAppState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const fields = gigFields(formData);
  if (!fields.title) return { ok: false, message: "Geef de show een titel." };
  if (!fields.date) return { ok: false, message: "Kies een datum." };

  const result = await write("gig.create", fields);
  if (!result.ok) return { ok: false, message: explain(result.error) };

  await log({
    actor: session.email,
    action: "bandapp.gig.create",
    detail: `${fields.date} ${fields.title}`,
  });
  refresh();

  return { ok: true, message: `"${fields.title}" staat in de agenda.` };
}

export async function updateGig(
  _previous: BandAppState,
  formData: FormData,
): Promise<BandAppState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, message: "Onbekende show." };
  }

  const fields = gigFields(formData);
  if (!fields.title) return { ok: false, message: "Geef de show een titel." };
  if (!fields.date) return { ok: false, message: "Kies een datum." };

  const result = await write("gig.update", { id, ...fields });
  if (!result.ok) return { ok: false, message: explain(result.error) };

  await log({
    actor: session.email,
    action: "bandapp.gig.update",
    subject: String(id),
    detail: `${fields.date} ${fields.title}`,
  });
  refresh();
  revalidatePath(`/beheer/bandapp/${id}`);

  return { ok: true, message: "Opgeslagen in de Band App." };
}

export async function deleteGig(
  _previous: BandAppState,
  formData: FormData,
): Promise<BandAppState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, message: "Onbekende show." };
  }

  const result = await write("gig.delete", { id });
  if (!result.ok) return { ok: false, message: explain(result.error) };

  await log({
    actor: session.email,
    action: "bandapp.gig.delete",
    subject: String(id),
  });
  refresh();

  return { ok: true, message: "Verwijderd uit de Band App." };
}
