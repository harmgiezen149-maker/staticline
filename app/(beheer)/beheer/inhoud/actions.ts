"use server";

import { del } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";

import { log } from "@/lib/portal/audit";
import {
  CONTENT_TAG,
  addMedia,
  removeMedia,
  saveContent,
} from "@/lib/portal/content";
import { SOCIAL_KEYS, SPOTIFY_KEYS, TEXT_KEYS } from "@/lib/portal/content-keys";
import { getSession } from "@/lib/portal/session";
import { youtubeId } from "@/lib/portal/youtube";

export type SaveState = { ok: boolean; message: string } | null;

const LOCALES = ["nl", "en"] as const;
const MAX_LENGTH = 2000;

/**
 * Alles op het inhoudscherm opslaan.
 *
 * De rechtencontrole staat hier, niet alleen op de pagina — een server action is
 * een eigen adres. Zie de waarschuwing in de Next-documentatie bij formulieren.
 *
 * Alleen sleutels die in content-keys.ts staan worden overgenomen. Wat er verder
 * in de FormData zit, wordt genegeerd: anders kan iemand die het verzoek zelf in
 * elkaar zet rijen wegschrijven onder sleutels die de site nergens leest, en dan
 * groeit die tabel vol met dingen die niemand kan vinden.
 */
async function admin() {
  const session = await getSession();
  if (!session) return { error: "Je bent uitgelogd." as const, session: null };
  if (session.role !== "admin") {
    return { error: "Alleen een beheerder kan dit wijzigen." as const, session: null };
  }
  return { error: null, session };
}

/**
 * Wat er na een wijziging ververst moet worden.
 *
 * `{ expire: 0 }` betekent: geen oude versie meer uitserveren, het eerstvolgende
 * verzoek wacht op de nieuwe. Dat is wat je wilt na een wijziging in het beheer —
 * je slaat op, kijkt op de site, en wil je eigen tekst zien.
 *
 * De documentatie noemt `updateTag` als de nettere weg hiervoor in een server
 * action, maar beschrijft dat voor tags die via `fetch` of `cacheTag` gezet zijn.
 * Deze tag komt uit `unstable_cache`, en `revalidateTag` is de tegenhanger die
 * daar gedocumenteerd bij hoort. Gaat dit ooit over op `use cache`, dan hoort
 * `updateTag` mee over.
 */
function refreshPublicPages() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/beheer/inhoud");
}

export async function saveAll(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const read = (name: string) =>
    String(formData.get(name) ?? "").trim().slice(0, MAX_LENGTH);

  const entries = [
    ...TEXT_KEYS.flatMap((field) =>
      LOCALES.map((locale) => ({
        key: field.key,
        locale,
        value: read(`${field.key}|${locale}`),
      })),
    ),
    ...[...SOCIAL_KEYS, ...SPOTIFY_KEYS].map((field) => ({
      key: field.key,
      locale: "",
      value: read(`${field.key}|`),
    })),
  ];

  const saved = await saveContent(entries, session.email);
  if (!saved) {
    return { ok: false, message: "Opslaan mislukt. Kijk in de logs van Vercel." };
  }

  await log({
    actor: session.email,
    action: "content.save",
    detail: `${entries.length} velden`,
  });
  refreshPublicPages();

  return { ok: true, message: "Opgeslagen. De site is bijgewerkt." };
}

export async function addVideo(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const raw = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const id = youtubeId(raw);

  if (!id) {
    return {
      ok: false,
      message: "Dat lijkt geen YouTube-link. Plak het hele adres van de video.",
    };
  }
  if (!title) return { ok: false, message: "Geef de video een titel." };

  const added = await addMedia(
    { kind: "video", url: id, alt: title, caption: "" },
    session.email,
  );
  if (!added) return { ok: false, message: "Toevoegen mislukt." };

  await log({ actor: session.email, action: "video.add", subject: id, detail: title });
  refreshPublicPages();

  return { ok: true, message: `"${title}" staat erbij.` };
}

/**
 * Een geüploade foto aanmelden.
 *
 * Het bestand staat op dat moment al in de opslag: de browser heeft het daar
 * rechtstreeks heen gestuurd. Deze stap zet de rij in de database, en
 * controleert opnieuw op beheerdersrechten — dat de upload gelukt is, zegt niets
 * over wie deze aanroep doet.
 */
export async function addPhoto(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 300);
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 300);

  // Alleen adressen uit de eigen Blob-opslag. Die host staat als enige in
  // next.config.ts; een ander adres zou next/image toch weigeren, en deze
  // controle zorgt dat je dat meteen te horen krijgt in plaats van later op een
  // kapotte fotopagina.
  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
    return { ok: false, message: "Dat adres komt niet uit de eigen opslag." };
  }
  if (!alt) {
    return {
      ok: false,
      message: "Beschrijf wat er op de foto te zien is. Dat is wat een blinde bezoeker voorgelezen krijgt.",
    };
  }

  const added = await addMedia({ kind: "photo", url, alt, caption }, session.email);
  if (!added) return { ok: false, message: "Toevoegen mislukt." };

  await log({ actor: session.email, action: "photo.add", subject: url, detail: alt });
  refreshPublicPages();

  return { ok: true, message: "De foto staat erbij." };
}

export async function deleteMedia(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, message: "Onbekend item." };
  }

  const removed = await removeMedia(id);
  if (!removed) return { ok: false, message: "Verwijderen mislukt." };

  // Bij een foto ook het bestand zelf weghalen. Alleen de rij verwijderen laat
  // een bestand achter dat niemand meer kan vinden maar dat wel meetelt voor de
  // opslag — en dat blijft groeien zonder dat iemand het merkt.
  if (removed.kind === "photo") {
    try {
      await del(removed.url);
    } catch (blobError) {
      // De rij is weg, dus de foto staat niet meer op de site. Het achtergebleven
      // bestand is vervelend maar geen reden om te melden dat het mislukt is.
      console.error("[inhoud] bestand niet uit de opslag verwijderd:", blobError);
    }
  }

  await log({ actor: session.email, action: "media.remove", subject: String(id) });
  refreshPublicPages();

  return { ok: true, message: "Verwijderd." };
}
