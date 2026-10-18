import "server-only";

import { cache } from "react";

import { getDb } from "@/lib/db";

import { type Role, roleFor, strongest } from "./access";

/**
 * Wie er in het besloten deel mag, naast de vaste lijsten in Vercel.
 *
 * Twee lagen. PORTAL_ADMINS en PORTAL_MEMBERS in Vercel blijven de vaste kern:
 * die zijn hier niet aan te passen, en daardoor is er altijd minstens één
 * beheerder die erin kan, ook als er in deze tabel iets misgaat. Daarbovenop
 * kan een beheerder in /beheer/toegang zelf mensen toegang geven, tot lid of
 * tot beheerder, zonder dat er iemand in Vercel hoeft te zijn. Telt allebei,
 * dan wint de hoogste rol (zie `strongest`).
 *
 * De tabel wordt bij het eerste gebruik zelf aangemaakt, zodat er na het
 * uitrollen niemand naar /beheer/database hoeft. Hij staat ook in
 * db/schema.sql, dat de bron van waarheid blijft.
 */

export type PortalUser = { email: string; role: Role; addedBy: string; addedAt: string };

let ensured = false;

async function ensure(sql: NonNullable<ReturnType<typeof getDb>>) {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS portal_users (
      email    text        PRIMARY KEY,
      role     text        NOT NULL CHECK (role IN ('admin', 'member')),
      added_by text        NOT NULL DEFAULT '',
      added_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  ensured = true;
}

/** De rol uit de database, of `null`. Bij een fout ook `null`: dan telt Vercel alleen. */
async function dbRole(email: string): Promise<Role | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    await ensure(sql);
    const rows = (await sql`SELECT role FROM portal_users WHERE email = ${email} LIMIT 1`) as { role: string }[];
    const role = rows[0]?.role;
    return role === "admin" || role === "member" ? role : null;
  } catch (error) {
    console.error("[beheer] portal_users niet gelezen:", error);
    return null;
  }
}

/**
 * De rol die telt: Vercel en de database samen. Per verzoek één keer
 * opgezocht (`cache`), ook al vragen meerdere stukken van een pagina erom.
 */
export const roleOf = cache(async (email: string): Promise<Role | null> => {
  const address = email.trim().toLowerCase();
  if (!address) return null;
  return strongest(roleFor(address), await dbRole(address));
});

/** Iedereen die in het beheer is toegevoegd, op volgorde van toevoegen. */
export async function listUsers(): Promise<PortalUser[] | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    await ensure(sql);
    const rows = (await sql`
      SELECT email, role, added_by, added_at FROM portal_users ORDER BY added_at, email
    `) as { email: string; role: Role; added_by: string; added_at: string | Date }[];
    return rows.map((r) => ({
      email: r.email,
      role: r.role,
      addedBy: r.added_by,
      addedAt: new Date(r.added_at).toISOString(),
    }));
  } catch (error) {
    console.error("[beheer] portal_users niet gelezen:", error);
    return null;
  }
}

/** Iemand toegang geven, of de rol aanpassen. */
export async function setUser(email: string, role: Role, actor: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  try {
    await ensure(sql);
    await sql`
      INSERT INTO portal_users (email, role, added_by)
      VALUES (${email}, ${role}, ${actor})
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
    `;
    return true;
  } catch (error) {
    console.error("[beheer] portal_users niet opgeslagen:", error);
    return false;
  }
}

/** De toegang intrekken. */
export async function removeUser(email: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  try {
    await ensure(sql);
    await sql`DELETE FROM portal_users WHERE email = ${email}`;
    return true;
  } catch (error) {
    console.error("[beheer] portal_users niet bijgewerkt:", error);
    return false;
  }
}
