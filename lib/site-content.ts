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

import type { BandAppMember, BandAppPublic } from "./band-app";
import { getCopy, type Copy } from "@/content";

import { applyOverrides } from "./copy-paths";
import type { Locale } from "./i18n";
import { parseSpotify, type SpotifyRef } from "./spotify";
import { loadContent, loadMedia } from "./portal/content";
import { type ImageSlot, storageKey } from "./portal/content-keys";
import { loadTranslations, pick } from "./portal/translations";

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

/**
 * De teksten van de site, met wat er in /beheer/inhoud is aangepast eroverheen.
 *
 * Dit is wat elke publieke pagina hoort te lezen in plaats van `getCopy`. Die
 * laatste geeft alleen wat er in content/nl.ts staat; deze legt de database
 * eroverheen. Een leeg veld daar verandert niets — zie applyOverrides.
 *
 * Asynchroon, en daarom leest elk publiek component dat met `await`. De prijs is
 * één regel per component; de opbrengst is dat elke tekst aan te passen is
 * zonder commit. `loadContent` is gecachet met een tag die bij het opslaan
 * vervalt, dus de pagina's blijven statisch.
 *
 * Niet voor `metadata`: dat is `meta` in content/types.ts, en die groep wordt
 * bewust overgeslagen. Zie SKIPPED in lib/copy-paths.ts.
 */
export async function getSiteCopy(locale: Locale): Promise<Copy> {
  const [content, base] = [await loadContent(), getCopy(locale)];

  // Alleen de sleutels van deze taal, met de taalaanduiding eraf.
  const achtervoegsel = `|${locale}`;
  const overrides: Record<string, string> = {};
  for (const [key, value] of Object.entries(content)) {
    if (key.endsWith(achtervoegsel)) {
      overrides[key.slice(0, -achtervoegsel.length)] = value;
    }
  }

  return applyOverrides(base, overrides);
}

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

/**
 * Wat er in de Spotify-sectie geladen wordt.
 *
 * Het veld wordt gelezen en niet letterlijk overgenomen. Er stond "het stuk
 * achter de laatste schuine streep", en wie daar de hele deellink in plakt —
 * wat iedereen doet — kreeg een embed met "Page not found" op de muziekpagina.
 * Zie lib/spotify.ts.
 *
 * Komt er niets bruikbaars uit, dan blijft de sectie weg. Dat is beter dan een
 * kader met een foutmelding van Spotify erin.
 */
export async function getSpotify(): Promise<SpotifyRef | null> {
  const content = await loadContent();
  const raw = content[storageKey("spotify.id")]?.trim();
  if (!raw) return codeSpotify;

  return parseSpotify(raw, content[storageKey("spotify.type")]?.trim());
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

/**
 * De bandgegevens in de taal van de pagina.
 *
 * De Band App kent één taal. Op `/en` komt de Engelse tekst uit de vertalingen
 * die in /beheer/vertalingen gemaakt zijn — maar alleen als die bij de huidige
 * Nederlandse tekst hoort. Is het origineel daarna gewijzigd, dan valt dit terug
 * op het Nederlands. Zie lib/portal/translations.ts voor waarom dat zo is.
 *
 * Op `/` gebeurt er niets: dan is de brontekst al de juiste tekst, en wordt er
 * niets uit de database gelezen.
 */
export async function localiseBand(
  data: BandAppPublic | null,
  locale: Locale,
): Promise<{ bio: string; members: BandAppMember[] }> {
  const bio = data?.band.bio?.trim() ?? "";
  const members = data?.members ?? [];

  if (locale === "nl" || !data) return { bio, members };

  const translations = await loadTranslations();
  const t = (id: string, source: string) =>
    source.trim() ? pick(id, source.trim(), translations) : source;

  return {
    bio: t("band.bio", bio),
    members: members.map((member) => ({
      ...member,
      role: t(`member.${member.id}.role`, member.role ?? ""),
      instrument: t(`member.${member.id}.instrument`, member.instrument ?? ""),
      bio: t(`member.${member.id}.bio`, member.bio ?? ""),
    })),
  };
}
