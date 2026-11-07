import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { log } from "@/lib/portal/audit";
import { CONTENT_TAG, loadContent, loadContentFresh, saveContent } from "@/lib/portal/content";
import { storageKey } from "@/lib/portal/content-keys";
import { SCREEN_KEY, parseScreen, type ScreenConfig } from "@/lib/screen";

/**
 * De instelling van het scherm uit de database, of de standaard. Gaat langs
 * dezelfde cache als de rest van de inhoud; opslaan hieronder ververst die.
 */
export async function loadScreen({ fresh = false } = {}): Promise<ScreenConfig> {
  const content = await (fresh ? loadContentFresh() : loadContent());
  return parseScreen(content[storageKey(SCREEN_KEY)]);
}

/**
 * Een (al genormaliseerde) instelling opslaan, vanuit /beheer/scherm of de
 * snelbediening in de Band App. Eén plek, zodat allebei dezelfde cache
 * verversen en in hetzelfde logboek staan.
 */
export async function storeScreen(config: ScreenConfig, actor: string, detail: string): Promise<boolean> {
  const saved = await saveContent([{ key: SCREEN_KEY, locale: "", value: JSON.stringify(config) }], actor);
  if (!saved) return false;

  await log({ actor, action: "screen.save", detail });
  // Zie refreshPublicPages in app/(beheer)/beheer/inhoud/actions.ts over
  // `{ expire: 0 }`. Een scherm dat al draait haalt het binnen tien seconden op.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/scherm");
  revalidatePath("/beheer/scherm");
  return true;
}
