"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { fetchBandAppPublic } from "@/lib/band-app";
import { log } from "@/lib/portal/audit";
import { CONTENT_TAG, saveContent } from "@/lib/portal/content";
import { getSession } from "@/lib/portal/session";
import { translate } from "@/lib/portal/translate";
import {
  collect,
  loadTranslations,
  rowsFor,
  statusOf,
} from "@/lib/portal/translations";

export type TranslateState = { ok: boolean; message: string } | null;

async function admin() {
  const session = await getSession();
  if (!session) return { error: "Je bent uitgelogd." as const, session: null };
  if (session.role !== "admin") {
    return { error: "Alleen een beheerder kan vertalen." as const, session: null };
  }
  return { error: null, session };
}

function refresh() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/beheer/vertalingen");
}

const REASONS: Record<string, string> = {
  "not-configured":
    "Er is geen ANTHROPIC_API_KEY ingesteld. Zonder die sleutel kan er niet vertaald worden.",
  failed: "Het vertalen lukte niet. De logs van Vercel zeggen wat er misging.",
  shape:
    "Er kwam een onverwacht antwoord terug. Er is niets opgeslagen — een vertaling die één plek is opgeschoven is erger dan geen vertaling.",
};

/**
 * Alles vertalen wat nog ontbreekt of verouderd is.
 *
 * Wat al actueel is, blijft staan. Opnieuw vertalen zou handmatige correcties
 * overschrijven, en dat is precies het werk dat je niet nog eens wilt doen.
 */
// Geen parameters: deze knop stuurt geen velden mee. Een action mag er minder
// aannemen dan useActionState doorgeeft.
export async function translateMissing(): Promise<TranslateState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const [data, stored] = await Promise.all([
    fetchBandAppPublic(),
    loadTranslations(),
  ]);

  const todo = collect(data).filter(
    (item) => statusOf(item, stored[item.id]) !== "current",
  );

  if (todo.length === 0) {
    return { ok: true, message: "Alles is al vertaald en actueel." };
  }

  const result = await translate(todo.map((item) => item.source));
  if (!result.ok) {
    return { ok: false, message: REASONS[result.error] ?? "Vertalen mislukt." };
  }

  const rows = todo.flatMap((item, index) =>
    rowsFor(item.id, result.translations[index], item.source),
  );

  const saved = await saveContent(rows, session.email);
  if (!saved) {
    return { ok: false, message: "Vertaald, maar opslaan mislukte." };
  }

  await log({
    actor: session.email,
    action: "translate.run",
    detail: `${todo.length} teksten`,
  });
  refresh();

  return {
    ok: true,
    message: `${todo.length} ${todo.length === 1 ? "tekst" : "teksten"} vertaald. Loop ze even na.`,
  };
}

/**
 * Eén vertaling met de hand bijstellen.
 *
 * De bronhash gaat mee: wie corrigeert, bevestigt daarmee dat deze Engelse tekst
 * bij de huidige Nederlandse hoort.
 */
export async function saveTranslation(
  _previous: TranslateState,
  formData: FormData,
): Promise<TranslateState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const id = String(formData.get("id") ?? "").trim();
  const text = String(formData.get("text") ?? "").slice(0, 4000);
  if (!id) return { ok: false, message: "Onbekende tekst." };

  // De brontekst opnieuw ophalen in plaats van uit het formulier lezen: anders
  // kan een oud tabblad een hash opslaan die bij een inmiddels gewijzigde
  // Nederlandse tekst hoort.
  const item = collect(await fetchBandAppPublic()).find((row) => row.id === id);
  if (!item) return { ok: false, message: "Die tekst bestaat niet meer." };

  const saved = await saveContent(rowsFor(id, text, item.source), session.email);
  if (!saved) return { ok: false, message: "Opslaan mislukt." };

  await log({ actor: session.email, action: "translate.edit", subject: id });
  refresh();

  return { ok: true, message: "Opgeslagen." };
}
