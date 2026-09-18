import "server-only";

import { unstable_cache } from "next/cache";

import { getDb } from "@/lib/db";

import { storageKey } from "./content-keys";

/**
 * De inhoud die via /beheer aan te passen is.
 *
 * Twee tabellen: `site_content` voor losse waarden (teksten per taal,
 * instellingen zonder taal) en `site_media` voor foto's en video's.
 *
 * Een ontbrekende of lege waarde betekent altijd: gebruik wat er in de code
 * staat. Daarom kan een leeggemaakt veld de site niet slopen, en werkt alles nog
 * steeds als deze tabellen er niet zijn.
 *
 * Over `unstable_cache`: dit wordt op elke publieke paginaweergave gelezen, en
 * zonder cache is dat een databaseaanroep per bezoeker. De documentatie wijst
 * naar `use cache` als opvolger, maar dat vraagt om Cache Components aan te
 * zetten voor de hele applicatie, en dat verandert hoe élke bestaande pagina
 * voorgerenderd wordt. Dat is een eigen besluit, geen bijvangst van een
 * beheerscherm. Zodra dat besluit genomen is, hoort dit mee over.
 */

export const CONTENT_TAG = "site-content";

export type ContentMap = Record<string, string>;

async function readContent(): Promise<ContentMap> {
  const sql = getDb();
  if (!sql) return {};

  try {
    const rows = (await sql`
      SELECT key, locale, value FROM site_content
    `) as { key: string; locale: string; value: string }[];

    return Object.fromEntries(
      rows
        .filter((row) => row.value.trim() !== "")
        .map((row) => [storageKey(row.key, row.locale), row.value]),
    );
  } catch (error) {
    // Ook als de tabel nog niet bestaat. De site hoort te blijven staan met de
    // teksten uit de code.
    console.error("[inhoud] site_content niet gelezen:", error);
    return {};
  }
}

export const loadContent = unstable_cache(readContent, ["site-content"], {
  tags: [CONTENT_TAG],
});

export type MediaRow = {
  id: number;
  kind: string;
  url: string;
  alt: string;
  caption: string;
  sort_order: number;
};

async function readMedia(): Promise<MediaRow[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = (await sql`
      SELECT id, kind, url, alt, caption, sort_order
      FROM site_media
      ORDER BY sort_order, id
    `) as MediaRow[];
    return rows;
  } catch (error) {
    console.error("[inhoud] site_media niet gelezen:", error);
    return [];
  }
}

export const loadMedia = unstable_cache(readMedia, ["site-media"], {
  tags: [CONTENT_TAG],
});

/**
 * Waarden opslaan.
 *
 * Een lege waarde wordt bewaard als lege rij en niet verwijderd. Zo is er
 * verschil tussen "hier is nooit iets ingevuld" en "dit is bewust leeggemaakt",
 * en bij het lezen valt allebei terug op de tekst uit de code.
 */
export async function saveContent(
  entries: { key: string; locale: string; value: string }[],
  actor: string,
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    for (const entry of entries) {
      await sql`
        INSERT INTO site_content (key, locale, value, updated_by)
        VALUES (${entry.key}, ${entry.locale}, ${entry.value}, ${actor})
        ON CONFLICT (key, locale) DO UPDATE
        SET value = ${entry.value}, updated_at = now(), updated_by = ${actor}
      `;
    }
    return true;
  } catch (error) {
    console.error("[inhoud] niet opgeslagen:", error);
    return false;
  }
}

/** Een video of foto toevoegen, onderaan de lijst. */
export async function addMedia(
  row: { kind: string; url: string; alt: string; caption: string },
  actor: string,
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      INSERT INTO site_media (kind, url, alt, caption, sort_order, updated_by)
      VALUES (
        ${row.kind}, ${row.url}, ${row.alt}, ${row.caption},
        COALESCE((SELECT max(sort_order) + 1 FROM site_media WHERE kind = ${row.kind}), 0),
        ${actor}
      )
    `;
    return true;
  } catch (error) {
    console.error("[inhoud] media niet toegevoegd:", error);
    return false;
  }
}

/**
 * Een rij verwijderen en teruggeven wat er stond.
 *
 * Wat er stond is nodig om bij een foto ook het bestand uit de Blob-opslag te
 * halen. Na het verwijderen is die informatie weg, dus hij komt hier mee terug.
 */
export async function removeMedia(
  id: number,
): Promise<{ kind: string; url: string } | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = (await sql`
      DELETE FROM site_media WHERE id = ${id} RETURNING kind, url
    `) as { kind: string; url: string }[];
    return rows[0] ?? null;
  } catch (error) {
    console.error("[inhoud] media niet verwijderd:", error);
    return null;
  }
}
