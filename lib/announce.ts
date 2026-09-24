import "server-only";

import { announcementMail, showName } from "./announce-mail";
import { getDb } from "./db";
import { dueIssues, sendIssue } from "./issues";
import { sendPreview, sendToList, type Compose } from "./list-mail";
import { log } from "./portal/audit";
import { siteUrl } from "./site";
import { getSiteCopy } from "./site-content";
import { getShows, type Show } from "./shows";

/**
 * Nieuwe shows aankondigen aan de nieuwsbrief.
 *
 * Elke ochtend draait er een ronde (app/api/cron/nieuwsbrief, ingepland in
 * vercel.json op 08:00 UTC: 10:00 in de zomer, 09:00 in de winter, en Vercel
 * neemt het op het gratis abonnement niet precies op de minuut). Die vergelijkt de komende shows uit de Band App met de tabel
 * `newsletter_announcements`, en elke show die daar nog niet in staat, gaat één
 * keer naar alle bevestigde abonnees, ieder in de taal waarin hij zich aanmeldde.
 *
 * Waarom een ronde op een vast moment en niet meteen bij het opslaan:
 *
 * - Een show komt op twee plekken binnen: in de Band App zelf en via
 *   /beheer/bandapp. Alleen door te kijken wat er in de agenda staat, zie je ze
 *   allebei.
 * - Wie 's avonds een show invoert en de volgende ochtend een typfout ziet, heeft
 *   tot de ronde de tijd. Een mail aan een lijst krijg je niet terug. In
 *   /beheer/nieuwsbrief staat wat er bij de volgende ronde meegaat, met een knop
 *   om een show over te slaan, meteen te versturen of eerst naar jezelf te sturen.
 *
 * De eerste ronde verstuurt niets: alles wat dan al in de agenda staat, gaat de
 * tabel in als 'baseline'. Die shows stonden al op de site. Wil je er één toch
 * aankondigen, dan kan dat met de hand in het beheer.
 *
 * Automatisch versturen staat standaard aan en is uit te zetten in het beheer
 * (site_content, sleutel `newsletter.auto`). Met de hand versturen kan altijd.
 */

export type AnnouncementStatus =
  | "baseline"
  | "sending"
  | "sent"
  | "skipped"
  | "failed";

export type Announcement = {
  show_id: number;
  status: AnnouncementStatus;
  label: string;
  recipients: number;
  actor: string;
  created_at: string;
  sent_at: string | null;
};

/** Wie een ronde deed, in het logboek en in de tabel. */
export const ROUND = "ronde";

const AUTO_KEY = "newsletter.auto";

/** Of de tabel er is. Zonder staat er in het beheer een aanwijzing. */
export async function announcementsReady(): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  try {
    await sql`SELECT 1 FROM newsletter_announcements LIMIT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function listAnnouncements(limit = 30): Promise<Announcement[]> {
  const sql = getDb();
  if (!sql) return [];
  try {
    return (await sql`
      SELECT show_id, status, label, recipients, actor, created_at, sent_at
      FROM newsletter_announcements
      ORDER BY COALESCE(sent_at, created_at) DESC
      LIMIT ${limit}
    `) as Announcement[];
  } catch (error) {
    console.error("[aankondiging] tabel niet gelezen:", error);
    return [];
  }
}

/** Staat automatisch versturen aan? Standaard wel. */
export async function autoEnabled(): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  try {
    const rows = (await sql`
      SELECT value FROM site_content WHERE key = ${AUTO_KEY} AND locale = ''
    `) as { value: string }[];
    return rows[0]?.value !== "off";
  } catch {
    return true;
  }
}

export async function setAuto(on: boolean, actor: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO site_content (key, locale, value, updated_by)
      VALUES (${AUTO_KEY}, '', ${on ? "on" : "off"}, ${actor})
      ON CONFLICT (key, locale) DO UPDATE
      SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by
    `;
    await log({ actor, action: "newsletter.auto", detail: on ? "aan" : "uit" });
    return true;
  } catch (error) {
    console.error("[aankondiging] instelling niet opgeslagen:", error);
    return false;
  }
}

/**
 * De eerste keer: alles wat er nu staat, als 'baseline'.
 *
 * Alleen als de tabel helemaal leeg is. Daarna komt een show die er niet in staat
 * per definitie later binnen dan de eerste ronde, en die is dus nieuw.
 */
async function ensureBaseline(upcoming: Show[]): Promise<void> {
  const sql = getDb();
  if (!sql || upcoming.length === 0) return;
  const [{ count }] = (await sql`
    SELECT count(*)::int AS count FROM newsletter_announcements
  `) as { count: number }[];
  if (count > 0) return;

  for (const show of upcoming) {
    await sql`
      INSERT INTO newsletter_announcements (show_id, status, label, actor)
      VALUES (${show.id}, 'baseline', ${label(show)}, ${ROUND})
      ON CONFLICT (show_id) DO NOTHING
    `;
  }
}

const label = (show: Show) => `${showName(show)} · ${show.date.slice(0, 10)}`;

/** De komende shows die nog niet aangekondigd, overgeslagen of als baseline gezien zijn. */
export async function pendingShows(): Promise<Show[]> {
  const sql = getDb();
  if (!sql) return [];
  const { upcoming, available } = await getShows();
  if (!available) return [];

  try {
    await ensureBaseline(upcoming);
    const rows = (await sql`SELECT show_id FROM newsletter_announcements`) as {
      show_id: string | number;
    }[];
    const known = new Set(rows.map((row) => Number(row.show_id)));
    return upcoming.filter((show) => !known.has(show.id));
  } catch (error) {
    console.error("[aankondiging] openstaande shows niet bepaald:", error);
    return [];
  }
}

/** Een komende show op id, voor de knoppen in het beheer. */
export async function findShow(id: number): Promise<Show | null> {
  const { upcoming } = await getShows();
  return upcoming.find((show) => show.id === id) ?? null;
}

/** De mail voor een show, in één taal, met de link van één abonnee eronder. */
async function composer(show: Show): Promise<Compose> {
  const site = siteUrl();
  const copies = {
    nl: (await getSiteCopy("nl")).mail,
    en: (await getSiteCopy("en")).mail,
  };
  return (locale, preferences) =>
    announcementMail({
      show,
      copy: copies[locale],
      locale,
      site,
      unsubscribeUrl: preferences,
    });
}

export type SendResult =
  | { ok: true; recipients: number }
  | {
      ok: false;
      reason: "no-db" | "busy" | "done" | "unknown-show" | "failed";
    };

/**
 * Eén show aankondigen.
 *
 * De rij gaat eerst op 'sending', en alleen wie die rij kan maken of omzetten,
 * mag versturen. Zo gaan twee rondes of twee drukken op de knop nooit allebei
 * mailen. Een eerdere 'baseline', 'skipped' of 'failed' mag met de hand alsnog;
 * 'sent' nooit een tweede keer.
 */
export async function announce(show: Show, actor: string): Promise<SendResult> {
  const sql = getDb();
  if (!sql) return { ok: false, reason: "no-db" };

  const claimed = (await sql`
    INSERT INTO newsletter_announcements (show_id, status, label, actor)
    VALUES (${show.id}, 'sending', ${label(show)}, ${actor})
    ON CONFLICT (show_id) DO UPDATE
      SET status = 'sending', label = EXCLUDED.label, actor = EXCLUDED.actor
      WHERE newsletter_announcements.status IN ('baseline', 'skipped', 'failed')
    RETURNING show_id
  `) as unknown[];
  if (claimed.length === 0) {
    const [row] = (await sql`
      SELECT status FROM newsletter_announcements WHERE show_id = ${show.id}
    `) as { status: string }[];
    return { ok: false, reason: row?.status === "sent" ? "done" : "busy" };
  }

  // Shows gaan naar iedereen die bevestigd is, ook wie geen ander nieuws wil.
  const { total, sent } = await sendToList("all", await composer(show));
  const failed = total > 0 && sent === 0;

  await sql`
    UPDATE newsletter_announcements
       SET status = ${failed ? "failed" : "sent"},
           recipients = ${sent},
           sent_at = ${failed ? null : new Date().toISOString()}
     WHERE show_id = ${show.id}
  `;
  await log({
    actor,
    action: failed ? "newsletter.announce.failed" : "newsletter.announce",
    subject: String(show.id),
    detail: `${label(show)} — ${sent} van ${total} adressen`,
  });

  return failed
    ? { ok: false, reason: "failed" }
    : { ok: true, recipients: sent };
}

/** Een show bewust niet aankondigen. */
export async function skip(show: Show, actor: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  const rows = (await sql`
    INSERT INTO newsletter_announcements (show_id, status, label, actor)
    VALUES (${show.id}, 'skipped', ${label(show)}, ${actor})
    ON CONFLICT (show_id) DO UPDATE
      SET status = 'skipped', actor = EXCLUDED.actor
      WHERE newsletter_announcements.status IN ('baseline', 'failed')
    RETURNING show_id
  `) as unknown[];
  if (rows.length > 0) {
    await log({
      actor,
      action: "newsletter.skip",
      subject: String(show.id),
      detail: label(show),
    });
  }
  return rows.length > 0;
}

/** Een voorbeeld naar één adres, en niet naar de lijst. Zie lib/list-mail.ts. */
export async function preview(show: Show, email: string): Promise<boolean> {
  return sendPreview(email, await composer(show));
}

export type RoundResult = {
  /** Of er naar nieuwe shows gekeken is. */
  ran: boolean;
  reason?: "no-db" | "off" | "no-agenda";
  announced: { show: string; recipients: number }[];
  failed: string[];
  /** Nieuwsbrieven die voor vandaag ingepland stonden. */
  issues: { id: number; recipients: number }[];
  issuesFailed: number[];
};

/**
 * De ochtendronde.
 *
 * Twee dingen, los van elkaar. Eerst de nieuwsbrieven die voor vandaag
 * ingepland staan (lib/issues.ts): die gaan ook als automatisch aankondigen uit
 * staat, want iemand heeft ze bewust op deze dag gezet. Daarna de nieuwe shows,
 * alleen als automatisch aankondigen aan staat.
 */
export async function runRound(): Promise<RoundResult> {
  const result: RoundResult = {
    ran: false,
    announced: [],
    failed: [],
    issues: [],
    issuesFailed: [],
  };
  if (!getDb()) return { ...result, reason: "no-db" };

  for (const id of await dueIssues()) {
    const sent = await sendIssue(id, ROUND);
    if (sent.ok) result.issues.push({ id, recipients: sent.recipients });
    else result.issuesFailed.push(id);
  }

  if (!(await autoEnabled())) return { ...result, reason: "off" };

  const { available } = await getShows();
  if (!available) return { ...result, reason: "no-agenda" };

  result.ran = true;
  for (const show of await pendingShows()) {
    const sent = await announce(show, ROUND);
    if (sent.ok)
      result.announced.push({ show: label(show), recipients: sent.recipients });
    else if (sent.reason === "failed") result.failed.push(label(show));
  }
  return result;
}
