import "server-only";

import { del } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";

import { log } from "@/lib/portal/audit";
import { addMedia, CONTENT_TAG, loadMediaFresh, removeMedia } from "@/lib/portal/content";
import { BLOB_URL } from "@/lib/portal/upload-rules";

/**
 * De foto's op de site, voor /beheer/inhoud en voor de Band App. Eén plek voor
 * de regels: alleen de eigen opslag, altijd een beschrijving, en bij verwijderen
 * ook het bestand zelf weg.
 */

export type SitePhoto = { id: number; url: string; alt: string; caption: string };
type Result = { ok: boolean; message: string };

export function refreshPhotoPages() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/beheer/inhoud");
}

/** De foto's zoals ze nu in de database staan, in de volgorde van de site. */
export async function listSitePhotos(): Promise<SitePhoto[]> {
  return (await loadMediaFresh())
    .filter((row) => row.kind === "photo")
    .map((row) => ({ id: row.id, url: row.url, alt: row.alt, caption: row.caption }));
}

export async function addSitePhoto(
  input: { url: unknown; alt: unknown; caption: unknown },
  actor: string,
): Promise<Result> {
  const url = String(input.url ?? "").trim();
  const alt = String(input.alt ?? "").trim().slice(0, 300);
  const caption = String(input.caption ?? "").trim().slice(0, 300);

  // Een ander adres zou next/image toch weigeren; zo hoor je het meteen in
  // plaats van later op een kapotte fotopagina.
  if (!BLOB_URL.test(url)) return { ok: false, message: "Dat adres komt niet uit de eigen opslag." };
  if (!alt) {
    return {
      ok: false,
      message: "Beschrijf wat er op de foto te zien is. Dat is wat een blinde bezoeker voorgelezen krijgt.",
    };
  }

  if (!(await addMedia({ kind: "photo", url, alt, caption }, actor))) {
    return { ok: false, message: "Toevoegen mislukt." };
  }
  await log({ actor, action: "photo.add", subject: url, detail: alt });
  refreshPhotoPages();
  return { ok: true, message: "De foto staat erbij." };
}

/** Een foto weghalen, en het bestand uit de opslag. Alleen foto's, geen video's. */
export async function removeSitePhoto(id: number, actor: string): Promise<Result> {
  if (!Number.isInteger(id) || id < 1) return { ok: false, message: "Onbekende foto." };
  if (!(await listSitePhotos()).some((photo) => photo.id === id)) {
    return { ok: false, message: "Die foto staat er niet (meer)." };
  }

  const removed = await removeMedia(id);
  if (!removed) return { ok: false, message: "Verwijderen mislukt." };

  // Alleen de rij weghalen laat een bestand achter dat niemand meer vindt maar
  // dat wel meetelt voor de opslag.
  try {
    await del(removed.url);
  } catch (error) {
    console.error("[foto's] bestand niet uit de opslag verwijderd:", error);
  }

  await log({ actor, action: "media.remove", subject: String(id) });
  refreshPhotoPages();
  return { ok: true, message: "Verwijderd." };
}
