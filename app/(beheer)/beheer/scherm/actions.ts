"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { log } from "@/lib/portal/audit";
import { CONTENT_TAG, saveContent } from "@/lib/portal/content";
import { getSession } from "@/lib/portal/session";
import { SCREEN_KEY, normalizeScreen, type ScreenConfig } from "@/lib/screen";

export type ScreenSaveState = { ok: boolean; message: string; config?: ScreenConfig } | null;

/**
 * De instelling van het scherm opslaan.
 *
 * Eén JSON-waarde in `site_content`, zie lib/screen.ts. Wat er binnenkomt gaat
 * eerst door normalizeScreen: alleen bekende velden, binnen de grenzen, en
 * alleen foto's uit de eigen opslag. De rechtencontrole staat hier en niet
 * alleen op de pagina, want een server action is een eigen adres.
 */
export async function saveScreen(json: string): Promise<ScreenSaveState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Je bent uitgelogd." };
  if (session.role !== "admin") return { ok: false, message: "Alleen een beheerder kan dit wijzigen." };

  let config: ScreenConfig;
  try {
    config = normalizeScreen(JSON.parse(json));
  } catch {
    return { ok: false, message: "Dat kon niet gelezen worden. Probeer het nog eens." };
  }

  const saved = await saveContent([{ key: SCREEN_KEY, locale: "", value: JSON.stringify(config) }], session.email);
  if (!saved) return { ok: false, message: "Opslaan mislukt. Kijk in de logs van Vercel." };

  await log({ actor: session.email, action: "screen.save", detail: `${config.slides.length} beelden` });
  // Zie refreshPublicPages in app/(beheer)/beheer/inhoud/actions.ts over
  // `{ expire: 0 }`. Een scherm dat al draait haalt het binnen een minuut op.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/scherm");
  revalidatePath("/beheer/scherm");

  return { ok: true, message: "Opgeslagen. Een scherm dat al draait neemt het binnen een minuut over.", config };
}
