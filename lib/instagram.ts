/**
 * De laatste Instagram-posts van de band, voor het blok op de homepage.
 *
 * Dit bestand is het rekenwerk, zonder netwerk en zonder database, zodat
 * `npm test` het kan draaien: wat er van het antwoord van Instagram overblijft,
 * en welke sleutel er geldt. Het ophalen en het vernieuwen van de sleutel staan
 * in lib/instagram-feed.ts.
 *
 * Over de sleutel: Instagram geeft een toegangssleutel die zestig dagen geldig
 * is en die je vóór die tijd kunt inruilen voor een nieuwe. De eerste zet de
 * beheerder als INSTAGRAM_ACCESS_TOKEN bij het Vercel-project; elke week ruilt
 * /api/cron/instagram hem in en bewaart de nieuwe in de eigen database. Een
 * omgevingsvariabele kan de site zelf niet aanpassen, vandaar die tweede plek.
 *
 * Bij de bewaarde sleutel staat een vingerafdruk van de omgevingsvariabele
 * waaruit hij voortkwam. Plakt de beheerder later een nieuwe sleutel in Vercel
 * — omdat de oude toch verlopen is, of omdat er een ander account aan hangt —
 * dan klopt die vingerafdruk niet meer en wint de nieuwe. Zonder die controle
 * zou de oude, bewaarde sleutel de nieuwe stilletjes blijven overstemmen.
 */
import { createHash } from "node:crypto";

export type InstagramPost = {
  id: string;
  /** De post op instagram.com. */
  href: string;
  /** Het beeld; bij een video het stilstaande voorbeeld. */
  image: string;
  /** Uit het bijschrift; leeg als er geen is. */
  alt: string;
  isVideo: boolean;
};

/** Zes: op een telefoon drie rijen van twee, op een groot scherm één rij. */
export const POST_LIMIT = 6;

type RawMedia = {
  id?: unknown;
  caption?: unknown;
  media_type?: unknown;
  media_url?: unknown;
  thumbnail_url?: unknown;
  permalink?: unknown;
};

const isHttps = (value: unknown): value is string =>
  typeof value === "string" && /^https:\/\//i.test(value);

/**
 * De eerste regel van het bijschrift, ingekort. Als alt-tekst: een
 * schermlezer hoeft niet de hele post met hashtags voor te lezen om te weten
 * welke tegel dit is.
 */
export function shortCaption(caption: unknown, max = 120): string {
  if (typeof caption !== "string") return "";
  const first = caption.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * Het antwoord van `/me/media` omzetten naar tegels.
 *
 * Alles wat geen beeld over https heeft, of geen link naar instagram.com, valt
 * weg. Beide komen op een publieke pagina terecht — in een `src` en een `href` —
 * dus wat Instagram terugstuurt, wordt hier niet blind doorgegeven.
 */
export function parsePosts(json: unknown, limit = POST_LIMIT): InstagramPost[] {
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];

  const posts: InstagramPost[] = [];
  for (const item of data as RawMedia[]) {
    const isVideo = item?.media_type === "VIDEO";
    const image = isVideo ? item.thumbnail_url : item?.media_url;
    const href = item?.permalink;
    if (!isHttps(image) || !isHttps(href)) continue;
    if (!/^https:\/\/(www\.)?instagram\.com\//i.test(href)) continue;

    posts.push({
      id: String(item.id ?? href),
      href,
      image,
      alt: shortCaption(item.caption),
      isVideo,
    });
    if (posts.length >= limit) break;
  }
  return posts;
}

/** "@staticline" uit een profiellink, voor naast de kop. */
export function handleFrom(profile: string | undefined): string | null {
  const match = profile?.match(/instagram\.com\/([A-Za-z0-9._]+)\/?(?:[?#]|$)/i);
  return match ? `@${match[1]}` : null;
}

export type StoredToken = { token: string; from: string };

/** Een korte vingerafdruk van een sleutel. Nooit de sleutel zelf bewaren als herkenning. */
export const fingerprint = (token: string) =>
  createHash("sha256").update(token).digest("hex").slice(0, 16);

/** Wat er in de database staat, of null als het geen bruikbare waarde is. */
export function readStored(value: string | undefined): StoredToken | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredToken>;
    return typeof parsed.token === "string" && parsed.token
      ? { token: parsed.token, from: typeof parsed.from === "string" ? parsed.from : "" }
      : null;
  } catch {
    return null;
  }
}

/**
 * Welke sleutel er geldt.
 *
 * - De vernieuwde sleutel uit de database, zolang hij voortkomt uit de sleutel
 *   die nu in Vercel staat.
 * - Staat er in Vercel een andere, dan die: de beheerder heeft hem vervangen.
 * - Staat er in Vercel niets meer, dan de bewaarde: die is nog gewoon geldig.
 */
export function pickToken(env: string | undefined, stored: StoredToken | null): string | null {
  const fromEnv = env?.trim() || "";
  if (stored && (!fromEnv || stored.from === fingerprint(fromEnv))) return stored.token;
  return fromEnv || null;
}
