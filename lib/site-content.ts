import "server-only";

import type { Photo } from "@/components/PhotoGrid";
import {
  photos as codePhotos,
  socials as codeSocials,
  spotify as codeSpotify,
  videos as codeVideos,
} from "@/content/media";

import heroBackground from "@/public/assets/background.jpg";
import wordmarkFile from "@/public/assets/staticline-wordmark.png";

import type { Locale } from "./i18n";
import { loadContent, loadMedia } from "./portal/content";
import { type ImageSlot, storageKey } from "./portal/content-keys";

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

export type SiteImage = {
  src: string;
  width: number;
  height: number;
  /** Alleen bij het bestand uit de code: de vervaging tijdens het laden. */
  blurDataURL?: string;
};

/**
 * Een van de twee vaste beelden.
 *
 * Staat er een geüpload bestand in de database, dan wint dat. Anders het bestand
 * uit `public/assets`, dat bij de import zijn eigen afmetingen en vervaging
 * meebrengt.
 *
 * De afmetingen komen bij een geüpload bestand uit de database, waar de browser
 * ze bij het uploaden heeft neergezet. Ontbreken ze — een rij van voor die
 * afspraak, of een mislukte uitlezing — dan valt hij terug op het bestand uit de
 * code. Een plaatje zonder afmetingen laten renderen zou de pagina laten
 * springen zodra het binnenkomt, en dat is erger dan het oude logo tonen.
 */
async function image(slot: ImageSlot, fallback: SiteImage): Promise<SiteImage> {
  const content = await loadContent();

  const src = content[storageKey(slot)]?.trim();
  if (!src) return fallback;

  const width = Number(content[storageKey(`${slot}.w`)]);
  const height = Number(content[storageKey(`${slot}.h`)]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    console.warn(`[inhoud] ${slot} heeft geen bruikbare afmetingen; code-versie gebruikt`);
    return fallback;
  }

  return { src, width, height };
}

export const getWordmark = () =>
  image("image.wordmark", {
    src: wordmarkFile.src,
    width: wordmarkFile.width,
    height: wordmarkFile.height,
    blurDataURL: wordmarkFile.blurDataURL,
  });

export const getHeroBackground = () =>
  image("image.hero", {
    src: heroBackground.src,
    width: heroBackground.width,
    height: heroBackground.height,
    blurDataURL: heroBackground.blurDataURL,
  });
