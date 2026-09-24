import "server-only";

import { getDb } from "./db";

/**
 * De tweede helft van de dubbele opt-in.
 *
 * Stond eerst in een API-route, maar de link uit een bevestigingsmail wordt door
 * een mens aangeklikt: die hoort op een pagina te landen die zegt wat er gebeurd
 * is, niet op een stuk JSON. De logica staat daarom hier, en de pagina's in
 * app/(nl)/nieuwsbrief/bevestigen en app/(en)/en/nieuwsbrief/bevestigen roepen
 * hem aan.
 *
 * Eén sleutel, één keer: na bevestigen doet dezelfde link niets meer dan
 * hetzelfde antwoord geven. `COALESCE` houdt het oorspronkelijke tijdstip vast,
 * zodat een tweede klik de datum niet opschuift.
 */
export type ConfirmResult = "ok" | "unknown" | "no-token" | "error";

export async function confirmSubscriber(
  token: string | undefined,
): Promise<ConfirmResult> {
  const clean = (token ?? "").trim();
  if (!clean) return "no-token";

  const sql = getDb();
  if (!sql) {
    console.error("[nieuwsbrief] geen DATABASE_URL — bevestigen niet mogelijk");
    return "error";
  }

  try {
    // Met de klik telt ook het vinkje voor ander nieuws, als dat gezet was: pas
    // nu is zeker dat het adres van degene is die het vinkje zette. Staat die
    // kolom er nog niet, dan zonder.
    const rows = await sql`
      UPDATE newsletter_subscribers
         SET confirmed_at = COALESCE(confirmed_at, now()),
             wants_news = COALESCE(news_request, wants_news),
             news_request = NULL
       WHERE token = ${clean}
      RETURNING email
    `.catch(
      () => sql`
        UPDATE newsletter_subscribers
           SET confirmed_at = COALESCE(confirmed_at, now())
         WHERE token = ${clean}
        RETURNING email
      `,
    );

    return rows.length === 0 ? "unknown" : "ok";
  } catch (error) {
    console.error("[nieuwsbrief] bevestigen mislukt:", error);
    return "error";
  }
}

/**
 * Afmelden met de sleutel uit de afmeldlink onderaan een nieuwsbrief.
 *
 * Echt verwijderen, net als afmelden vanuit het beheer (lib/portal/subscribers.ts):
 * wie eraf wil, hoort weg te zijn. Het is dezelfde sleutel als die uit de
 * bevestigingsmail; wie die heeft, is degene die zich aanmeldde.
 */
export type UnsubscribeResult = "ok" | "unknown" | "no-token" | "error";

export async function unsubscribe(
  token: string | undefined,
): Promise<UnsubscribeResult> {
  const clean = (token ?? "").trim();
  if (!clean) return "no-token";

  const sql = getDb();
  if (!sql) {
    console.error("[nieuwsbrief] geen DATABASE_URL — afmelden niet mogelijk");
    return "error";
  }

  try {
    const rows = await sql`
      DELETE FROM newsletter_subscribers WHERE token = ${clean} RETURNING id
    `;
    return rows.length === 0 ? "unknown" : "ok";
  } catch (error) {
    console.error("[nieuwsbrief] afmelden mislukt:", error);
    return "error";
  }
}

/**
 * Wie er achter een sleutel zit, voor de instellingenpagina.
 *
 * Alleen of hij bevestigd is en of hij ook nieuws wil, en nooit het adres: de
 * pagina hoeft niet te zeggen wie je bent, en een doorgestuurde mail hoort geen
 * adres van iemand anders te laten zien.
 */
export async function subscriberByToken(
  token: string | undefined,
): Promise<{ wantsNews: boolean } | null> {
  const clean = (token ?? "").trim();
  const sql = getDb();
  if (!clean || !sql) return null;
  try {
    const rows = (await sql`
      SELECT wants_news FROM newsletter_subscribers WHERE token = ${clean}
    `) as { wants_news: boolean }[];
    return rows[0] ? { wantsNews: rows[0].wants_news } : null;
  } catch (error) {
    console.error("[nieuwsbrief] abonnee niet gelezen:", error);
    return null;
  }
}

/** Ander nieuws aan- of uitzetten, met de sleutel uit de link. */
export async function setNews(
  token: string | undefined,
  on: boolean,
): Promise<UnsubscribeResult> {
  const clean = (token ?? "").trim();
  if (!clean) return "no-token";
  const sql = getDb();
  if (!sql) return "error";
  try {
    const rows = await sql`
      UPDATE newsletter_subscribers SET wants_news = ${on}
       WHERE token = ${clean}
      RETURNING id
    `;
    return rows.length === 0 ? "unknown" : "ok";
  } catch (error) {
    console.error("[nieuwsbrief] instelling niet opgeslagen:", error);
    return "error";
  }
}
