import "server-only";

import { getDb } from "@/lib/db";
import {
  fingerprint,
  parsePosts,
  pickToken,
  POST_LIMIT,
  readStored,
  type InstagramPost,
} from "@/lib/instagram";

/**
 * Instagram ophalen, en de sleutel daarvoor vernieuwen.
 *
 * Via de Instagram API met Instagram-login: dat werkt voor een zakelijk of
 * creator-account, zonder Facebook-pagina erbij. Hoe je aan de eerste sleutel
 * komt, staat in docs/07-instellen.md. Het rekenwerk staat in lib/instagram.ts.
 *
 * Niets hiervan mag de homepage laten omvallen. Geen sleutel, een verlopen
 * sleutel, Instagram die niet antwoordt: dan komt er een lege lijst terug en
 * toont het blok alleen de link naar het profiel. Elke fout gaat naar het log,
 * zonder de sleutel erin.
 */

const API = "https://graph.instagram.com";

/** In site_content, net als de schakelaar van de nieuwsbrief. Zonder taal. */
const KEY = "instagram.token";

/**
 * Een uur. De beelden van Instagram staan op adressen die na een paar dagen
 * verlopen, dus de lijst moet regelmatig vers; vaker dan elk uur heeft geen
 * zin voor een band die een paar keer per week post.
 */
const REVALIDATE_S = 3600;

const envToken = () => process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || undefined;

async function storedToken() {
  const sql = getDb();
  if (!sql) return null;
  try {
    const rows = (await sql`
      SELECT value FROM site_content WHERE key = ${KEY} AND locale = ''
    `) as { value: string }[];
    return readStored(rows[0]?.value);
  } catch (error) {
    console.error("[instagram] bewaarde sleutel niet gelezen:", error);
    return null;
  }
}

async function currentToken(): Promise<string | null> {
  return pickToken(envToken(), await storedToken());
}

/** Het foutbericht van Instagram, kort. Daar staat de sleutel niet in. */
async function reason(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string; code?: number } };
    return `${res.status} ${body.error?.code ?? ""} ${body.error?.message ?? ""}`.trim();
  } catch {
    return String(res.status);
  }
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  const token = await currentToken();
  if (!token) return [];

  const url = new URL(`${API}/me/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink");
  // Een paar meer dan we tonen: een post zonder bruikbaar beeld valt weg.
  url.searchParams.set("limit", String(POST_LIMIT * 2));
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_S, tags: ["instagram"] } });
    if (!res.ok) {
      console.error("[instagram] posts niet opgehaald:", await reason(res));
      return [];
    }
    return parsePosts(await res.json());
  } catch (error) {
    console.error("[instagram] posts niet opgehaald:", error instanceof Error ? error.message : error);
    return [];
  }
}

export type RefreshResult =
  | { ok: true; expiresInDays: number }
  | { ok: false; reason: string };

/**
 * De sleutel inruilen voor een nieuwe die weer zestig dagen geldt, en die
 * bewaren. Draait elke week vanuit /api/cron/instagram.
 *
 * Instagram ruilt een sleutel pas in als hij minstens een dag oud is; een
 * weigering de eerste dag na het instellen is dus geen probleem, de week erna
 * lukt het wel.
 */
export async function refreshToken(): Promise<RefreshResult> {
  const token = await currentToken();
  if (!token) return { ok: false, reason: "no-token" };
  const sql = getDb();
  if (!sql) return { ok: false, reason: "no-database" };

  const url = new URL(`${API}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);

  let body: { access_token?: string; expires_in?: number };
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, reason: await reason(res) };
    body = await res.json();
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
  if (!body.access_token) return { ok: false, reason: "no-token-in-response" };

  const env = envToken();
  const value = JSON.stringify({ token: body.access_token, from: env ? fingerprint(env) : "" });
  try {
    await sql`
      INSERT INTO site_content (key, locale, value, updated_by)
      VALUES (${KEY}, '', ${value}, 'cron')
      ON CONFLICT (key, locale) DO UPDATE
      SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by
    `;
  } catch (error) {
    return { ok: false, reason: `not-saved: ${error instanceof Error ? error.message : error}` };
  }
  return { ok: true, expiresInDays: Math.round((body.expires_in ?? 0) / 86400) };
}
