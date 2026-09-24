/**
 * De nieuwsbriefabonnees.
 *
 * `confirmed_at` leeg betekent: aangemeld maar nog niet bevestigd. Die mag je
 * niet aanschrijven — zonder die stap kan iemand anders jouw adres invullen. Het
 * scherm laat ze wel zien, want een lange rij onbevestigde aanmeldingen zegt
 * iets: dan komt de bevestigingsmail niet aan.
 */

import "server-only";

import { getDb } from "@/lib/db";

export type Subscriber = {
  id: number;
  email: string;
  locale: string;
  confirmed_at: string | null;
  created_at: string;
  /** Wil naast de shows ook ander nieuws. */
  wants_news: boolean;
};

/**
 * Lezen met `wants_news`, en zonder als die kolom er nog niet is.
 *
 * De kolom komt er pas bij het bijwerken van de database in /beheer/database.
 * Tot die tijd hoort de lijst gewoon te blijven werken, met iedereen op "alleen
 * shows" — want dat is precies wat ze toen kregen.
 */
async function read(onlyConfirmed: boolean): Promise<Subscriber[]> {
  const sql = getDb();
  if (!sql) return [];
  const where = onlyConfirmed ? "WHERE confirmed_at IS NOT NULL" : "";
  try {
    return (await sql.query(
      `SELECT id, email, locale, confirmed_at, created_at, wants_news
       FROM newsletter_subscribers ${where} ORDER BY created_at DESC`,
    )) as Subscriber[];
  } catch {
    const rows = (await sql.query(
      `SELECT id, email, locale, confirmed_at, created_at
       FROM newsletter_subscribers ${where} ORDER BY created_at DESC`,
    )) as Omit<Subscriber, "wants_news">[];
    return rows.map((row) => ({ ...row, wants_news: false }));
  }
}

export async function list(): Promise<Subscriber[]> {
  try {
    return await read(false);
  } catch (error) {
    console.error("[beheer] abonnees niet gelezen:", error);
    return [];
  }
}

/** Alleen de bevestigde adressen — dit is de lijst waar je aan mag mailen. */
export async function confirmed(): Promise<Subscriber[]> {
  try {
    return await read(true);
  } catch (error) {
    console.error("[beheer] bevestigde abonnees niet gelezen:", error);
    return [];
  }
}

/**
 * Iemand afmelden.
 *
 * Echt verwijderen en niet een vlaggetje zetten. Wie zich afmeldt hoort weg te
 * zijn, en een tabel met adressen van mensen die er niet meer in willen staan is
 * precies wat je niet wilt bewaren.
 */
export async function remove(id: number): Promise<string | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = (await sql`
      DELETE FROM newsletter_subscribers WHERE id = ${id} RETURNING email
    `) as { email: string }[];
    return rows[0]?.email ?? null;
  } catch (error) {
    console.error("[beheer] abonnee niet verwijderd:", error);
    return null;
  }
}
