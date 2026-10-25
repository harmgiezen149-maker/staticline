import "server-only";

import { cache } from "react";

import { DESIGN_KEY, parseDesign, type Design } from "@/lib/design";
import { loadContent } from "@/lib/portal/content";
import { storageKey } from "@/lib/portal/content-keys";

/**
 * Het gekozen ontwerp, uit `site_content`, of "klassiek". Gaat langs dezelfde
 * cache als de rest van de inhoud, en per verzoek één keer (`cache`): de
 * layout en de componenten vragen het allemaal.
 */
export const getDesign = cache(async (): Promise<Design> => {
  const content = await loadContent();
  return parseDesign(content[storageKey(DESIGN_KEY)]);
});
