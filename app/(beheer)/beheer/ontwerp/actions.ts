"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { DESIGN_KEY, parseDesign } from "@/lib/design";
import { log } from "@/lib/portal/audit";
import { CONTENT_TAG, saveContent } from "@/lib/portal/content";
import { getSession } from "@/lib/portal/session";

/**
 * Het ontwerp van de publieke site wisselen. Eén waarde in `site_content`; de
 * rechtencontrole staat hier en niet alleen op de pagina, want een server
 * action is een eigen adres.
 */
export async function setDesign(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const design = parseDesign(formData.get("ontwerp"));
  const saved = await saveContent([{ key: DESIGN_KEY, locale: "", value: design }], session.email);
  if (!saved) return;

  await log({ actor: session.email, action: "design.set", detail: design });
  // Zie refreshPublicPages in app/(beheer)/beheer/inhoud/actions.ts over
  // `{ expire: 0 }`: de volgende bezoeker ziet meteen het andere ontwerp.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/beheer/ontwerp");
}
