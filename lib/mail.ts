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
