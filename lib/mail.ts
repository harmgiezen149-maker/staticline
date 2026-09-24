import "server-only";

/**
 * Mail versturen via Resend.
 *
 * Rechtstreeks over de REST-API met `fetch`, zonder de `resend`-package. Het is
 * één POST met vijf velden; een afhankelijkheid die daarvoor meeverhuist met elke
 * versiebump levert hier niets op.
 *
 * Twee dingen werken net als bij lib/turnstile.ts en lib/db.ts:
 *
 * - Zonder `RESEND_API_KEY` doet dit niets, logt het een waarschuwing en meldt het
 *   `false`. De site blijft werken; een boeking hoort nooit te stranden omdat er
 *   geen mailkoppeling is.
 * - Het gooit nooit. Een aanroeper krijgt een `boolean` en beslist zelf wat dat
 *   betekent. Voor een boeking betekent het niets — die staat dan al in de
 *   database en bij de Band App.
 *
 * Instellen: zie docs/07-instellen.md.
 */
import { toHtml } from "./mail-html";

const API = "https://api.resend.com/emails";

/** Het afzenderadres. Moet op een domein staan dat in Resend geverifieerd is. */
const FROM = process.env.MAIL_FROM || "Static Line <boeking@staticline.nl>";

/** Waar een antwoord op een bevestigingsmail heen moet: de echte mailbox. */
const REPLY_TO = process.env.MAIL_REPLY_TO || "boeking@staticline.nl";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

type Mail = {
  to: string;
  subject: string;
  /** De regels van het bericht. Lege string is een witregel. */
  lines: string[];
};

export async function sendMail({ to, subject, lines }: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.warn(
      `[mail] geen RESEND_API_KEY ingesteld — "${subject}" niet verstuurd`,
    );
    return false;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        text: lines.join("\n"),
        html: toHtml(lines),
      }),
    });

    if (!res.ok) {
      // Het antwoord van Resend zegt precies wat er mis is — meestal een domein
      // dat nog niet geverifieerd is. Dat hoort in het log te staan, anders is
      // het niet te vinden.
      const detail = await res.text().catch(() => "");
      console.error(`[mail] Resend gaf ${res.status}: ${detail.slice(0, 300)}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[mail] Resend is niet bereikbaar:", error);
    return false;
  }
}

export type BatchMail = Mail & {
  /**
   * Een eigen opgemaakte versie (lib/list-mail-html.ts). Zonder wordt het de
   * sobere HTML uit de regels. De platte regels gaan altijd mee: een mail met
   * alleen HTML scoort slechter bij spamfilters.
   */
  html?: string;
  /** Extra mailkoppen, zoals List-Unsubscribe. */
  headers?: Record<string, string>;
};

/** Zoveel mails neemt Resend in één batchaanroep. */
const BATCH_SIZE = 100;

/**
 * Veel mails tegelijk, voor de nieuwsbrief.
 *
 * Via de batch-API van Resend: honderd per aanroep, en tussen twee aanroepen een
 * korte pauze, omdat Resend standaard twee aanroepen per seconde toestaat. Elke
 * mail is persoonlijk — hij heeft een eigen afmeldlink — dus één mail met alle
 * adressen in BCC kan niet.
 *
 * Geeft terug hoeveel er zijn aangenomen. Net als sendMail gooit dit nooit.
 */
export async function sendBatch(mails: BatchMail[]): Promise<number> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(
      `[mail] geen RESEND_API_KEY ingesteld — ${mails.length} mails niet verstuurd`,
    );
    return 0;
  }

  let sent = 0;
  for (let start = 0; start < mails.length; start += BATCH_SIZE) {
    const chunk = mails.slice(start, start + BATCH_SIZE);
    if (start > 0) await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const res = await fetch(`${API}/batch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          chunk.map((mail) => ({
            from: FROM,
            to: [mail.to],
            reply_to: REPLY_TO,
            subject: mail.subject,
            text: mail.lines.join("\n"),
            html: mail.html ?? toHtml(mail.lines),
            ...(mail.headers ? { headers: mail.headers } : {}),
          })),
        ),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(
          `[mail] Resend-batch gaf ${res.status}: ${detail.slice(0, 300)}`,
        );
        continue;
      }
      sent += chunk.length;
    } catch (error) {
      console.error("[mail] Resend is niet bereikbaar:", error);
    }
  }
  return sent;
}
