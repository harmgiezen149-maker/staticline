import "server-only";

import type { Photo } from "@/components/PhotoGrid";
import {
  photos as codePhotos,
  socials as codeSocials,
  spotify as codeSpotify,
  videos as codeVideos,
} from "@/content/media";

import type { Locale } from "./i18n";
import { loadContent, loadMedia } from "./portal/content";
import { storageKey } from "./portal/content-keys";

/**
 * Wat de publieke site aan inhoud toont.
 *
 * Eén laag over content/media.ts en content/nl.ts heen: staat er iets in de
 * database, dan wint dat; staat er niets, dan blijft wat er in de code staat.
 *
 * Die volgorde is met opzet. Het beheerscherm kan daardoor nooit een pagina leeg
 * of stuk maken — het ergste wat een leeggemaakt veld doet, is terugvallen op de
 * tekst waarmee de site nu al live staat. En het werkt ook als de tabellen er
 * niet zijn, wat de eerste keer nu eenmaal zo is.
 */

/** Een tekst ophalen met de tekst uit de code als terugval. */
export async function getText(
  key: string,
  locale: Locale,
  fallback: string,
): Promise<string> {
  const content = await loadContent();
  return content[storageKey(key, locale)] ?? fallback;
}

export async function getPhotos(): Promise<Photo[]> {
  const rows = (await loadMedia()).filter((row) => row.kind === "photo");
  if (rows.length === 0) return codePhotos;

  return rows.map((row) => ({
    src: row.url,
    alt: row.alt,
    caption: row.caption,
  }));
}

export async function getVideos(): Promise<{ id: string; title: string }[]> {
  const rows = (await loadMedia()).filter((row) => row.kind === "video");
  if (rows.length === 0) return codeVideos;

  // Bij een video staat de titel in `alt`: dat is het veld dat beschrijft wat je
  // ziet, en bij een video is dat de titel.
  return rows.map((row) => ({ id: row.url, title: row.alt }));
}

const SPOTIFY_TYPES = ["artist", "album", "playlist"] as const;
type SpotifyType = (typeof SPOTIFY_TYPES)[number];

export async function getSpotify(): Promise<{
  type: SpotifyType;
  id: string;
} | null> {
  const content = await loadContent();
  const id = content[storageKey("spotify.id")]?.trim();
  if (!id) return codeSpotify;

  const raw = content[storageKey("spotify.type")]?.trim();
  // Iets anders dan de drie bekende soorten zou een embed opleveren die niet
  // laadt. Dan liever een artiest, dat is verreweg het gewone geval.
  const type = (SPOTIFY_TYPES as readonly string[]).includes(raw ?? "")
    ? (raw as SpotifyType)
    : "artist";

  return { type, id };
}

export async function getSocials(): Promise<{
  instagram?: string;
  youtube?: string;
  spotify?: string;
  facebook?: string;
}> {
  const content = await loadContent();

  const pick = (name: string) => {
    const value = content[storageKey(`social.${name}`)]?.trim();
    // Alleen http(s): deze waarde komt in een `href` op een publieke pagina.
    return value && /^https?:\/\//i.test(value) ? value : undefined;
  };

  const fromDb = {
    instagram: pick("instagram"),
    youtube: pick("youtube"),
    spotify: pick("spotify"),
    facebook: pick("facebook"),
  };

  return Object.values(fromDb).some(Boolean) ? fromDb : codeSocials;
}
