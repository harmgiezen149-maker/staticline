import "server-only";

import { getDb } from "./db";
import { localePath, type Locale } from "./i18n";
import { sendBatch, type BatchMail } from "./mail";
import { siteUrl } from "./site";

/**
 * Mail aan de nieuwsbrieflijst. Eén route voor alles wat naar de abonnees gaat:
 * de aankondiging van een nieuwe show (lib/announce.ts) en de nieuwsbrieven die
 * in het beheer geschreven worden (lib/issues.ts).
 *
 * Hier staat wat voor elke mail aan de lijst gelijk hoort te zijn, zodat het
 * nooit bij de één wel en bij de ander niet klopt:
 *
 * - alleen bevestigde adressen, en voor ander nieuws alleen wie dat aan heeft
 *   staan (`wants_news`);
 * - elke mail persoonlijk, in de taal van de abonnee, met een eigen link naar
 *   /nieuwsbrief/afmelden (afmelden, of nieuws aan en uit);
 * - de koppen List-Unsubscribe en List-Unsubscribe-Post, zodat afmelden ook met
 *   de knop in het mailprogramma zelf werkt (RFC 8058). Gmail en Yahoo vragen
 *   dat van wie aan een lijst mailt, en wie van een lijst af wil en geen knop
 *   ziet, drukt op "spam";
 * - versturen via de batch-API van Resend (lib/mail.ts).
 */

/** Aan wie: iedereen die bevestigd is, of alleen wie ook nieuws wil. */
export type Audience = "all" | "news";

export type Recipient = { email: string; locale: Locale; token: string };

export async function recipients(audience: Audience): Promise<Recipient[]> {
  const sql = getDb();
  if (!sql) return [];
  const rows = (await (audience === "news"
    ? sql`
        SELECT email, locale, token FROM newsletter_subscribers
        WHERE confirmed_at IS NOT NULL AND wants_news
      `
    : sql`
        SELECT email, locale, token FROM newsletter_subscribers
        WHERE confirmed_at IS NOT NULL
      `)) as { email: string; locale: string; token: string }[];
  return rows.map((row) => ({
    ...row,
    locale: row.locale === "en" ? "en" : "nl",
  }));
}

/** Hoeveel adressen een mail aan deze groep zou bereiken. Voor het beheerscherm. */
export async function audienceSize(audience: Audience): Promise<number> {
  try {
    return (await recipients(audience)).length;
  } catch {
    return 0;
  }
}

/** De link onder een mail: de pagina om af te melden of nieuws aan en uit te zetten. */
export function preferencesUrl(token: string, locale: Locale): string {
  return `${siteUrl()}${localePath(locale, "/nieuwsbrief/afmelden")}?token=${encodeURIComponent(token)}`;
}

/** Een mail zonder de afmeldlink erin: die vult buildFor zelf in. */
export type Compose = (
  locale: Locale,
  preferences: string,
) => { subject: string; lines: string[]; html?: string };

/**
 * Eén mail naar de lijst.
 *
 * `compose` maakt de mail voor één taal, met de link naar de instellingenpagina
 * van die ene abonnee. Geeft terug aan hoeveel adressen hij had moeten gaan en
 * hoeveel Resend er heeft aangenomen.
 */
export async function sendToList(
  audience: Audience,
  compose: Compose,
): Promise<{ total: number; sent: number }> {
  const to = await recipients(audience);
  if (to.length === 0) return { total: 0, sent: 0 };

  const site = siteUrl();
  const mails: BatchMail[] = to.map((person) => {
    const token = encodeURIComponent(person.token);
    return {
      to: person.email,
      ...compose(person.locale, preferencesUrl(person.token, person.locale)),
      headers: {
        "List-Unsubscribe": `<${site}/api/nieuwsbrief/afmelden?token=${token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });

  return { total: to.length, sent: await sendBatch(mails) };
}

/**
 * Een voorbeeld naar één adres, en niet naar de lijst.
 *
 * Met een link die nergens op werkt: dit adres hoeft niet op de lijst te staan,
 * en als hij er wél op staat, hoort een klik in een voorbeeld hem er niet af te
 * halen.
 */
export async function sendPreview(
  email: string,
  compose: Compose,
): Promise<boolean> {
  const mail = compose("nl", preferencesUrl("voorbeeld", "nl"));
  const sent = await sendBatch([
    { to: email, ...mail, subject: `[Voorbeeld] ${mail.subject}` },
  ]);
  return sent === 1;
}
