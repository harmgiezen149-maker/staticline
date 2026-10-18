import "server-only";

import { loadContent } from "@/lib/portal/content";
import { storageKey } from "@/lib/portal/content-keys";
import { SCREEN_KEY, parseScreen, type ScreenConfig } from "@/lib/screen";

/**
 * De instelling van het scherm uit de database, of de standaard. Gaat langs
 * dezelfde cache als de rest van de inhoud; opslaan in /beheer/scherm
 * ververst die (zie app/(beheer)/beheer/scherm/actions.ts).
 */
export async function loadScreen(): Promise<ScreenConfig> {
  const content = await loadContent();
  return parseScreen(content[storageKey(SCREEN_KEY)]);
}
