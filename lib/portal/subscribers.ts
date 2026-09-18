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
};

export async function list(): Promise<Subscriber[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = (await sql`
      SELECT id, email, locale, confirmed_at, created_at
      FROM newsletter_subscribers
      ORDER BY created_at DESC
    `) as Subscriber[];
    return rows;
  } catch (error) {
    console.error("[beheer] abonnees niet gelezen:", error);
    return [];
  }
}

/** Alleen de bevestigde adressen — dit is de lijst waar je aan mag mailen. */
export async function confirmed(): Promise<Subscriber[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = (await sql`
      SELECT id, email, locale, confirmed_at, created_at
      FROM newsletter_subscribers
      WHERE confirmed_at IS NOT NULL
      ORDER BY created_at DESC
    `) as Subscriber[];
    return rows;
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
