import "server-only";

import { getDb } from "./db";
import { issueMail, missing, type IssueText } from "./issue-mail";
import { sendPreview, sendToList, type Compose } from "./list-mail";
import { log } from "./portal/audit";
import { siteUrl } from "./site";
import { getSiteCopy } from "./site-content";

/**
 * Nieuwsbrieven over iets anders dan een nieuwe show.
 *
 * Geschreven in /beheer/nieuwsbrief/schrijven, bewaard in `newsletter_issues`,
 * en verstuurd via dezelfde route als de aankondiging van een show
 * (lib/list-mail.ts) — maar alleen naar wie ook ander nieuws wil. Wie zich
 * aanmeldde voor "een mail als er een show bij komt", krijgt dit dus niet, tot
 * hij het zelf aanzet.
 *
 * Een nieuwsbrief is een concept tot hij verstuurd is. Versturen kan meteen, of
 * op een dag die je kiest: dan gaat hij mee met de ochtendronde van die dag
 * (runRound in lib/announce.ts). Verstuurd is verstuurd: daarna is hij niet meer
 * te wijzigen of opnieuw te versturen, en dat staat in de database vast en niet
 * alleen in het scherm.
 */

export type IssueStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export type Issue = IssueText & {
  id: number;
  status: IssueStatus;
  scheduled_for: string | null;
  recipients: number;
  created_by: string;
  updated_at: string;
  sent_by: string;
  sent_at: string | null;
};

/** Wat nog te wijzigen is. */
export const EDITABLE: IssueStatus[] = ["draft", "scheduled", "failed"];

const COLUMNS = `id, subject_nl, body_nl, subject_en, body_en, status,
  to_char(scheduled_for, 'YYYY-MM-DD') AS scheduled_for, recipients, created_by,
  updated_at, sent_by, sent_at`;

const asIssue = (row: Record<string, unknown>) =>
  ({ ...row, id: Number(row.id) }) as Issue;

export async function listIssues(): Promise<Issue[]> {
  const sql = getDb();
  if (!sql) return [];
  try {
    const rows = await sql.query(
      `SELECT ${COLUMNS} FROM newsletter_issues ORDER BY COALESCE(sent_at, updated_at) DESC LIMIT 50`,
    );
    return (rows as Record<string, unknown>[]).map(asIssue);
  } catch (error) {
    console.error("[nieuwsbrief] brieven niet gelezen:", error);
    return [];
  }
}

export async function getIssue(id: number): Promise<Issue | null> {
  const sql = getDb();
  if (!sql || !Number.isInteger(id) || id < 1) return null;
  try {
    const rows = await sql.query(
      `SELECT ${COLUMNS} FROM newsletter_issues WHERE id = $1`,
      [id],
    );
    const row = (rows as Record<string, unknown>[])[0];
    return row ? asIssue(row) : null;
  } catch (error) {
    console.error("[nieuwsbrief] brief niet gelezen:", error);
    return null;
  }
}

export type IssueFields = IssueText & { scheduled_for: string | null };

/**
 * Een concept opslaan: nieuw als er geen id is, anders bijwerken.
 *
 * Bijwerken alleen zolang hij niet verstuurd is. Verandert de tekst van een
 * ingeplande brief, dan gaat hij terug op concept: wie de tekst aanpast, plant
 * hem daarna bewust opnieuw in, in plaats van dat een half aangepaste versie
 * morgenochtend vertrekt. Blijft de tekst gelijk — een voorbeeld naar jezelf
 * sturen slaat ook op — dan blijft de planning staan.
 */
export async function saveIssue(
  fields: IssueFields,
  actor: string,
  id?: number,
): Promise<number | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    if (!id) {
      const rows = (await sql`
        INSERT INTO newsletter_issues (subject_nl, body_nl, subject_en, body_en, created_by)
        VALUES (${fields.subject_nl}, ${fields.body_nl}, ${fields.subject_en}, ${fields.body_en}, ${actor})
        RETURNING id
      `) as { id: string | number }[];
      return Number(rows[0].id);
    }
    const rows = (await sql`
      UPDATE newsletter_issues
         SET status = CASE WHEN changed THEN 'draft' ELSE newsletter_issues.status END,
             scheduled_for = CASE WHEN changed THEN NULL ELSE newsletter_issues.scheduled_for END,
             subject_nl = ${fields.subject_nl},
             body_nl = ${fields.body_nl},
             subject_en = ${fields.subject_en},
             body_en = ${fields.body_en},
             updated_at = now()
        FROM (
          SELECT (subject_nl, body_nl, subject_en, body_en)
                 IS DISTINCT FROM (${fields.subject_nl}::text, ${fields.body_nl}::text,
                                   ${fields.subject_en}::text, ${fields.body_en}::text) AS changed
            FROM newsletter_issues WHERE id = ${id}
        ) AS diff
       WHERE newsletter_issues.id = ${id}
         AND newsletter_issues.status IN ('draft', 'scheduled', 'failed')
      RETURNING newsletter_issues.id
    `) as { id: string | number }[];
    return rows[0] ? Number(rows[0].id) : null;
  } catch (error) {
    console.error("[nieuwsbrief] brief niet opgeslagen:", error);
    return null;
  }
}

/** Inplannen voor de ochtendronde van `date` (JJJJ-MM-DD). */
export async function scheduleIssue(
  id: number,
  date: string,
  actor: string,
): Promise<boolean> {
  const sql = getDb();
  if (!sql || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const rows = (await sql`
    UPDATE newsletter_issues
       SET status = 'scheduled', scheduled_for = ${date}::date, updated_at = now()
     WHERE id = ${id} AND status IN ('draft', 'scheduled', 'failed')
    RETURNING id
  `) as unknown[];
  if (rows.length > 0) {
    await log({
      actor,
      action: "newsletter.issue.schedule",
      subject: String(id),
      detail: date,
    });
  }
  return rows.length > 0;
}

/** Een concept weggooien. Een verstuurde brief blijft staan, als archief. */
export async function deleteIssue(id: number, actor: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  const rows = (await sql`
    DELETE FROM newsletter_issues
     WHERE id = ${id} AND status IN ('draft', 'scheduled', 'failed')
    RETURNING id
  `) as unknown[];
  if (rows.length > 0) {
    await log({
      actor,
      action: "newsletter.issue.delete",
      subject: String(id),
    });
  }
  return rows.length > 0;
}

async function composer(issue: IssueText): Promise<Compose> {
  const copies = {
    nl: (await getSiteCopy("nl")).mail,
    en: (await getSiteCopy("en")).mail,
  };
  const site = siteUrl();
  return (locale, preferences) =>
    issueMail({ issue, locale, copy: copies[locale], preferences, site });
}

export async function previewIssue(
  issue: IssueText,
  email: string,
): Promise<boolean> {
  return sendPreview(email, await composer(issue));
}

export type IssueSendResult =
  | { ok: true; recipients: number }
  | { ok: false; message: string };

/**
 * Een brief versturen.
 *
 * Eerst claimen: de rij gaat op 'sending', en alleen wie hem omzet, verstuurt.
 * Zo versturen twee drukken op de knop, of een knop en de ochtendronde, hem
 * nooit allebei.
 */
export async function sendIssue(
  id: number,
  actor: string,
): Promise<IssueSendResult> {
  const sql = getDb();
  if (!sql) return { ok: false, message: "Er is geen database gekoppeld." };

  const issue = await getIssue(id);
  if (!issue)
    return { ok: false, message: "Deze nieuwsbrief bestaat niet (meer)." };
  const problem = missing(issue);
  if (problem) return { ok: false, message: problem };

  const claimed = (await sql`
    UPDATE newsletter_issues SET status = 'sending', updated_at = now()
     WHERE id = ${id} AND status IN ('draft', 'scheduled', 'failed')
    RETURNING id
  `) as unknown[];
  if (claimed.length === 0) {
    return {
      ok: false,
      message: "Deze nieuwsbrief is al verstuurd, of wordt het nu.",
    };
  }

  const { total, sent } = await sendToList("news", await composer(issue));
  const failed = total > 0 && sent === 0;

  await sql`
    UPDATE newsletter_issues
       SET status = ${failed ? "failed" : "sent"},
           recipients = ${sent},
           sent_by = ${actor},
           sent_at = ${failed ? null : new Date().toISOString()},
           updated_at = now()
     WHERE id = ${id}
  `;
  await log({
    actor,
    action: failed ? "newsletter.issue.failed" : "newsletter.issue.send",
    subject: String(id),
    detail: `${issue.subject_nl} — ${sent} van ${total} adressen`,
  });

  return failed
    ? {
        ok: false,
        message:
          "Versturen mislukt. Staat RESEND_API_KEY bij Vercel? Je kunt het opnieuw proberen.",
      }
    : { ok: true, recipients: sent };
}

/**
 * De brieven die vandaag of eerder ingepland staan, voor de ochtendronde.
 *
 * "Vandaag" in Nederland: de ronde draait om 08:00 UTC, en dat is overal in het
 * jaar al de goede dag, maar een brief die met de hand ná middernacht UTC en vóór
 * middernacht hier ingepland wordt, hoort bij de Nederlandse datum.
 */
export async function dueIssues(): Promise<number[]> {
  const sql = getDb();
  if (!sql) return [];
  try {
    const rows = (await sql`
      SELECT id FROM newsletter_issues
       WHERE status = 'scheduled'
         AND scheduled_for <= (now() AT TIME ZONE 'Europe/Amsterdam')::date
       ORDER BY scheduled_for, id
    `) as { id: string | number }[];
    return rows.map((row) => Number(row.id));
  } catch (error) {
    console.error("[nieuwsbrief] ingeplande brieven niet gelezen:", error);
    return [];
  }
}
