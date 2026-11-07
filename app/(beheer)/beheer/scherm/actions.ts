"use server";

import { getSession } from "@/lib/portal/session";
import { normalizeScreen, type ScreenConfig } from "@/lib/screen";
import { storeScreen } from "@/lib/screen-store";

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

  const saved = await storeScreen(config, session.email, `${config.slides.length} beelden`);
  if (!saved) return { ok: false, message: "Opslaan mislukt. Kijk in de logs van Vercel." };

  return { ok: true, message: "Opgeslagen. Een scherm dat al draait neemt het binnen tien seconden over.", config };
}
