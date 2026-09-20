/**
 * De boekingsaanvragen uit de eigen database.
 *
 * Dit is het enige deel van het besloten deel waar echt iets verloren ging: een
 * aanvraag kwam binnen per mail en was daarna weg. De Band App krijgt hem ook
 * doorgestuurd, maar bewaart er zes velden van — naam, mail, telefoon, gewenste
 * datum, soort en bericht. Budget, speelduur, zaalgrootte, parkeren, backstage
 * en PA staan alleen hier.
 */

import "server-only";

import { getDb } from "@/lib/db";

import { type Status } from "./booking-status";

// Doorgeven, zodat een aanroeper die toch al bookings.ts gebruikt niet twee
// importregels nodig heeft.
export { STATUSES, STATUS_LABELS, isStatus, type Status } from "./booking-status";

export type Booking = {
  id: number;
  kind: string;
  name: string;
  email: string;
  phone: string;
  wanted_date: string;
  location: string;
  wanted_time: string;
  duration: string;
  event_type: string;
  budget: string;
  room_size: string;
  parking: string;
  backstage: string;
  pa: string;
  message: string;
  status: string;
  note: string;
  forwarded: boolean;
  /**
   * Het id van dezelfde aanvraag in de Band App, of `null`.
   *
   * Gevuld betekent: die app is de baas over `status` hierboven, en wat hier
   * staat is een afspiegeling. Leeg betekent: deze aanvraag heeft de Band App
   * nooit bereikt, of kwam binnen voordat die koppeling bestond — dan is de
   * stand hier de enige die er is. Zie booking-sync.ts.
   */
  band_app_id: number | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string;
};

const COLUMNS = `id, kind, name, email, phone, wanted_date, location, wanted_time,
  duration, event_type, budget, room_size, parking, backstage, pa, message,
  status, note, forwarded, band_app_id, created_at, updated_at, updated_by`;

/**
 * De aanvragen, nieuwste eerst.
 *
 * Geen paginering. Een bandsite die in een goed jaar honderd aanvragen krijgt,
 * heeft geen bladerknoppen nodig — en een lijst die in één keer laadt is op een
 * telefoon sneller dan een lijst die dat in stukjes doet.
 */
export async function list(status?: Status): Promise<Booking[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = status
      ? await sql.query(
          `SELECT ${COLUMNS} FROM booking_submissions WHERE status = $1 ORDER BY created_at DESC`,
          [status],
        )
      : await sql.query(
          `SELECT ${COLUMNS} FROM booking_submissions ORDER BY created_at DESC`,
        );
    return rows as Booking[];
  } catch (error) {
    console.error("[beheer] aanvragen niet gelezen:", error);
    return [];
  }
}

/** Hoeveel er in elke status staan. Voor de tellers boven de lijst. */
export async function counts(): Promise<Record<string, number>> {
  const sql = getDb();
  if (!sql) return {};

  try {
    const rows = (await sql`
      SELECT status, count(*)::int AS aantal
      FROM booking_submissions
      GROUP BY status
    `) as { status: string; aantal: number }[];
    return Object.fromEntries(rows.map((row) => [row.status, row.aantal]));
  } catch (error) {
    console.error("[beheer] tellingen niet gelezen:", error);
    return {};
  }
}

export async function get(id: number): Promise<Booking | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = (await sql.query(
      `SELECT ${COLUMNS} FROM booking_submissions WHERE id = $1 LIMIT 1`,
      [id],
    )) as Booking[];
    return rows[0] ?? null;
  } catch (error) {
    console.error("[beheer] aanvraag niet gelezen:", error);
    return null;
  }
}

/**
 * De status en de notitie bijwerken.
 *
 * Allebei in één opdracht, want ze komen van één formulier. `handled` gaat mee
 * voor de oude kolom: die wordt nergens meer gelezen, maar hem stil uit de pas
 * laten lopen is het soort detail waar iemand later over struikelt.
 */
export async function update(
  id: number,
  status: Status,
  note: string,
  actor: string,
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    const rows = (await sql`
      UPDATE booking_submissions
      SET status = ${status},
          note = ${note},
          handled = ${status !== "new"},
          updated_at = now(),
          updated_by = ${actor}
      WHERE id = ${id}
      RETURNING id
    `) as { id: number }[];
    return rows.length > 0;
  } catch (error) {
    console.error("[beheer] aanvraag niet bijgewerkt:", error);
    return false;
  }
}

/**
 * De aanvragen die aan de Band App gekoppeld zijn, met hun huidige stand hier.
 *
 * Alleen de drie velden die de synchronisatie nodig heeft. Een volledige lijst
 * ophalen om er drie kolommen uit te gebruiken is zonde bij elk beheerscherm dat
 * geopend wordt.
 */
export async function linked(): Promise<
  { id: number; band_app_id: number; status: string }[]
> {
  const sql = getDb();
  if (!sql) return [];

  try {
    return (await sql`
      SELECT id, band_app_id, status
      FROM booking_submissions
      WHERE band_app_id IS NOT NULL
    `) as { id: number; band_app_id: number; status: string }[];
  } catch (error) {
    console.error("[beheer] koppelingen niet gelezen:", error);
    return [];
  }
}

/**
 * De afspiegeling van de stand bijwerken.
 *
 * Alleen de stand, en bewust zonder `updated_at` en `updated_by`: dit is geen
 * wijziging van een mens op dit scherm, het is het overnemen van wat er in de
 * Band App staat. Die twee kolommen horen te blijven wijzen naar wie hier voor
 * het laatst iets deed.
 */
export async function mirrorStatus(id: number, status: Status): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  try {
    await sql`
      UPDATE booking_submissions
      SET status = ${status}, handled = ${status !== "new"}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error("[beheer] stand niet overgenomen:", error);
  }
}

/**
 * De aanvragen die bij deze Band App-ids horen.
 *
 * Opzoeken op `band_app_id` en niet op het eigen id: de Band App kent zijn eigen
 * nummers en niet die van deze site. Zie lib/portal/booking-sync.ts voor hoe die
 * koppeling ontstaat.
 */
export async function byBandAppIds(ids: number[]): Promise<Booking[]> {
  const sql = getDb();
  if (!sql || ids.length === 0) return [];

  try {
    const rows = await sql.query(
      `SELECT ${COLUMNS} FROM booking_submissions WHERE band_app_id = ANY($1)`,
      [ids],
    );
    return rows as Booking[];
  } catch (error) {
    console.error("[beheer] aanvragen niet opgezocht:", error);
    return [];
  }
}

/**
 * Alleen de notitie bijwerken, opgezocht via de Band App.
 *
 * Los van `update` hierboven, dat status én notitie in één opdracht zet omdat ze
 * daar van één formulier komen. In de Band App staat de notitie op zichzelf: de
 * status zit daar al in de app zelf, en die hoort niet meegeschreven te worden
 * omdat iemand een zin typt.
 */
export async function setNoteByBandAppId(
  bandAppId: number,
  note: string,
  actor: string,
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    const rows = (await sql`
      UPDATE booking_submissions
      SET note = ${note}, updated_at = now(), updated_by = ${actor}
      WHERE band_app_id = ${bandAppId}
      RETURNING id
    `) as { id: number }[];
    return rows.length > 0;
  } catch (error) {
    console.error("[beheer] notitie niet bijgewerkt:", error);
    return false;
  }
}
