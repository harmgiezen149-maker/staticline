import "server-only";

import { loadContent } from "./content";

import { type Stored, hashKey } from "./translation-keys";

/**
 * De opgeslagen vertalingen lezen.
 *
 * De rest — hashen, status bepalen, kiezen welke taal er getoond wordt — staat in
 * translation-keys.ts, zonder `server-only` en met tests.
 */
export * from "./translation-keys";

/** De opgeslagen vertalingen, op id. */
export async function loadTranslations(): Promise<Record<string, Stored>> {
  const content = await loadContent();
  const out: Record<string, Stored> = {};

  for (const [key, value] of Object.entries(content)) {
    // loadContent levert sleutels als `${key}|${locale}`.
    const [name, locale] = key.split("|");
    if (locale !== "en" || !name.startsWith("tr:")) continue;

    const id = name.slice(3);
    out[id] = {
      text: value,
      sourceHash: content[`${hashKey(id)}|`] ?? "",
    };
  }

  return out;
}
