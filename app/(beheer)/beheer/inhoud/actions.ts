"use server";

import { del } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";

import { log } from "@/lib/portal/audit";
import {
  CONTENT_TAG,
  addMedia,
  loadContent,
  removeMedia,
  saveContent,
} from "@/lib/portal/content";
import {
  SOCIAL_KEYS,
  SPOTIFY_KEYS,
  TEXT_KEYS,
  isImageSlot,
} from "@/lib/portal/content-keys";
import { getSession } from "@/lib/portal/session";
import { codeText } from "@/lib/portal/copy-text";
import { dutchText, siteHashKey, siteTextStale } from "@/lib/portal/site-texts";
import { translate } from "@/lib/portal/translate";
import { hashSource } from "@/lib/portal/translation-keys";
import { youtubeId } from "@/lib/portal/youtube";

export type SaveState = { ok: boolean; message: string } | null;

/** Alleen adressen uit de eigen Blob-opslag; zie next.config.ts bij `images`. */
const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

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

  const content = await loadContent();

  const entries = [
    ...TEXT_KEYS.flatMap((field) => {
      const rows: { key: string; locale: string; value: string }[] =
        LOCALES.map((locale) => ({
          key: field.key,
          locale,
          value: read(`${field.key}|${locale}`),
        }));

      // De bronhash meeschrijven. Wie hier opslaat, ziet het Nederlands en het
      // Engels onder elkaar staan en bevestigt daarmee dat ze bij elkaar horen —
      // ook als hij de Engelse tekst zelf heeft aangepast. Zonder dit zou een
      // eigen correctie daarna alsnog als verouderd gelden.
      const dutch = rows.find((row) => row.locale === "nl")?.value || "";
      const english = rows.find((row) => row.locale === "en")?.value || "";
      const source = dutch || dutchText(field.key, content, codeText(field.key, "nl"));

      rows.push({
        key: siteHashKey(field.key),
        locale: "",
        value: english ? hashSource(source) : "",
      });

      return rows;
    }),
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
  if (!BLOB_URL.test(url)) {
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

/**
 * Een van de twee vaste beelden vervangen.
 *
 * De afmetingen komen mee omdat `next/image` ze nodig heeft om ruimte vrij te
 * houden voor het plaatje er is. Zonder die twee getallen springt de pagina op
 * het moment dat het binnenkomt, en dat is precies wat het ontwerp met
 * `priority` op de hero probeert te voorkomen.
 */
export async function saveImage(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const slot = formData.get("slot");
  if (!isImageSlot(slot)) return { ok: false, message: "Onbekend beeld." };

  const url = String(formData.get("url") ?? "").trim();
  if (!BLOB_URL.test(url)) {
    return { ok: false, message: "Dat adres komt niet uit de eigen opslag." };
  }

  const width = Math.round(Number(formData.get("width")));
  const height = Math.round(Number(formData.get("height")));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return {
      ok: false,
      message: "De afmetingen van het bestand konden niet gelezen worden.",
    };
  }

  const saved = await saveContent(
    [
      { key: slot, locale: "", value: url },
      { key: `${slot}.w`, locale: "", value: String(width) },
      { key: `${slot}.h`, locale: "", value: String(height) },
    ],
    session.email,
  );
  if (!saved) return { ok: false, message: "Opslaan mislukt." };

  await log({ actor: session.email, action: "image.save", subject: slot, detail: url });
  refreshPublicPages();

  return { ok: true, message: "Vervangen. Kijk op de homepage." };
}

/** Terug naar het bestand uit de code. */
export async function resetImage(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const slot = formData.get("slot");
  if (!isImageSlot(slot)) return { ok: false, message: "Onbekend beeld." };

  const saved = await saveContent(
    [
      { key: slot, locale: "", value: "" },
      { key: `${slot}.w`, locale: "", value: "" },
      { key: `${slot}.h`, locale: "", value: "" },
    ],
    session.email,
  );
  if (!saved) return { ok: false, message: "Terugzetten mislukt." };

  await log({ actor: session.email, action: "image.reset", subject: slot });
  refreshPublicPages();

  return { ok: true, message: "Terug op het bestand uit de code." };
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

const TRANSLATE_REASONS: Record<string, string> = {
  "not-configured":
    "Er is geen ANTHROPIC_API_KEY ingesteld. Zonder die sleutel kan er niet vertaald worden.",
  failed: "Het vertalen lukte niet. De logs van Vercel zeggen wat er misging.",
  shape:
    "Er kwam een onverwacht antwoord terug. Er is niets opgeslagen — een vertaling die \u00e9\u00e9n plek is opgeschoven is erger dan geen vertaling.",
};

/**
 * De Nederlandse teksten van de site naar het Engels zetten.
 *
 * Werkt op wat er opgeslagen staat, niet op wat er in het formulier getypt is:
 * een server action krijgt het formulier niet te zien als hij niet bij dat
 * formulier hoort. Sla je wijzigingen dus eerst op.
 *
 * Alleen wat leeg of verouderd is. Een Engelse tekst die je zelf getypt hebt
 * blijft staan — die overschrijven is precies het werk dat je niet nog eens wilt
 * doen.
 */
export async function translateSiteTexts(): Promise<SaveState> {
  const { error, session } = await admin();
  if (error) return { ok: false, message: error };

  const content = await loadContent();

  const todo = TEXT_KEYS.map((field) => ({
    key: field.key,
    source: dutchText(field.key, content, codeText(field.key, "nl")),
    english: (content[`${field.key}|en`] ?? "").trim(),
    stale: siteTextStale(field.key, content, codeText(field.key, "nl")),
  })).filter((item) => item.source && (!item.english || item.stale));

  if (todo.length === 0) {
    return { ok: true, message: "Alle Engelse teksten zijn ingevuld en actueel." };
  }

  const result = await translate(todo.map((item) => item.source));
  if (!result.ok) {
    return {
      ok: false,
      message: TRANSLATE_REASONS[result.error] ?? "Vertalen mislukt.",
    };
  }

  const rows = todo.flatMap((item, index) => [
    { key: item.key, locale: "en", value: result.translations[index].trim() },
    { key: siteHashKey(item.key), locale: "", value: hashSource(item.source) },
  ]);

  const saved = await saveContent(rows, session.email);
  if (!saved) return { ok: false, message: "Vertaald, maar opslaan mislukte." };

  await log({
    actor: session.email,
    action: "translate.site",
    detail: `${todo.length} teksten`,
  });
  refreshPublicPages();

  return {
    ok: true,
    message: `${todo.length} ${todo.length === 1 ? "tekst" : "teksten"} vertaald. Loop ze even na.`,
  };
}
