import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { getDb } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { makeLimiter } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site";

import { type Role, roleFor } from "./access";
import { log } from "./audit";

/**
 * Inloggen met een eenmalige link.
 *
 * Je vult je adres in, krijgt een mailtje, klikt, bent binnen. Geen wachtwoorden
 * om te vergeten, te hergebruiken of te beheren, en geen wachtwoordherstel dat
 * zelf weer een aanvalsvlak is. Voor vier mensen die een paar keer per maand
 * inloggen is dat de rustigste opzet.
 *
 * De sleutel is een kwartier geldig en werkt één keer. Dat "één keer" is geen
 * overdreven voorzichtigheid: mailprogramma's en scanners openen links soms
 * vooraf, en zonder die grens zou je uitgelogd raken door je eigen mail te openen
 * — vandaar dat de gebruikte sleutel bewaard blijft in plaats van verwijderd, zie
 * `consume`.
 */

const TTL_MINUTES = 15;

// Vijf per adres per kwartier is ruim voor wie de mail niet ziet binnenkomen en
// het nog eens probeert. Twintig per afzender, want een heel gezin of een hele
// oefenruimte kan achter één verbinding zitten. Net als elders in dit project:
// een drempel, geen muur — op Vercel begint elke koude start met een lege teller.
const perEmail = makeLimiter({ max: 5, windowMs: TTL_MINUTES * 60 * 1000 });
const perIp = makeLimiter({ max: 20, windowMs: TTL_MINUTES * 60 * 1000 });

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export type LinkResult = "ok" | "rate-limited" | "error";

/**
 * Een inloglink aanvragen.
 *
 * Een bekend en een onbekend adres leveren allebei `"ok"` op. Wie het formulier
 * gebruikt om uit te vragen wie er in de band zit, komt zo niets te weten.
 *
 * Maar een database die omvalt levert `"error"` op, en dat is met opzet: dat is
 * geen informatie over een adres maar over de server. Dit stond eerst anders —
 * álles gaf `"ok"` — en toen bleek in productie dat de tabel niet bestond terwijl
 * het scherm vrolijk "kijk in je mail" zei. Een storing hoort zichtbaar te zijn.
 *
 * Dat een kapotte mailkoppeling daarmee verraadt dát een adres bestaat, is een
 * bewuste ruil. Die toestand hoort niet te bestaan, en zolang hij bestaat is het
 * belangrijker dat jij hem ziet.
 */
export async function requestLink(email: string, ip: string): Promise<LinkResult> {
  const address = email.trim().toLowerCase();
  const now = Date.now();

  if (!perIp(`i:${ip}`, now) || !perEmail(`e:${address}`, now)) {
    return "rate-limited";
  }

  const role = roleFor(address);
  if (!role) {
    console.warn(`[beheer] inlogpoging voor onbekend adres vanaf ${ip}`);
    return "ok";
  }

  const sql = getDb();
  if (!sql) {
    console.error("[beheer] geen DATABASE_URL, dus geen inloglink");
    return "error";
  }

  const token = randomBytes(32).toString("base64url");
  const expires = new Date(now + TTL_MINUTES * 60 * 1000);

  try {
    // Meteen opruimen wat toch niet meer kan werken. Geen aparte opruimtaak voor
    // een tabel die een paar regels per maand krijgt.
    await sql`DELETE FROM portal_login_tokens WHERE expires_at < now() - interval '1 day'`;
    await sql`
      INSERT INTO portal_login_tokens (email, token_hash, expires_at)
      VALUES (${address}, ${hash(token)}, ${expires.toISOString()})
    `;
  } catch (error) {
    console.error("[beheer] inloglink niet opgeslagen:", error);
    return "error";
  }

  const url = `${siteUrl()}/api/beheer/verify?token=${encodeURIComponent(token)}`;

  const sent = await sendMail({
    to: address,
    subject: "Inloggen op het beheer van staticline.nl",
    lines: [
      "Klik op deze link om in te loggen:",
      url,
      "",
      `De link is ${TTL_MINUTES} minuten geldig en werkt één keer.`,
      "",
      "Heb je niet zelf om deze link gevraagd? Dan hoef je niets te doen. Zonder deze klik gebeurt er niets.",
    ],
  });

  if (!sent) {
    console.error("[beheer] inloglink niet verstuurd — staat RESEND_API_KEY er?");
    return "error";
  }

  await log({ actor: address, action: "login.request", detail: `vanaf ${ip}` });
  return "ok";
}

export type Consumed =
  | { ok: true; email: string; role: Role }
  | { ok: false; reason: "no-token" | "unknown" | "expired" | "used" | "error" };

/**
 * Een inloglink verzilveren.
 *
 * De sleutel wordt op zijn hash opgezocht, want de sleutel zelf staat nergens.
 * Gebruikt worden is geen verwijderen maar een stempel: zo is "deze link is al
 * gebruikt" te onderscheiden van "deze link bestaat niet", en dat scheelt bij het
 * uitzoeken waarom iemand er niet in komt.
 */
export async function consume(token: string): Promise<Consumed> {
  const value = token.trim();
  if (!value) return { ok: false, reason: "no-token" };

  const sql = getDb();
  if (!sql) return { ok: false, reason: "error" };

  try {
    const rows = (await sql`
      SELECT id, email, expires_at, used_at
      FROM portal_login_tokens
      WHERE token_hash = ${hash(value)}
      LIMIT 1
    `) as { id: number; email: string; expires_at: string; used_at: string | null }[];

    const row = rows[0];
    if (!row) return { ok: false, reason: "unknown" };
    if (row.used_at) return { ok: false, reason: "used" };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false, reason: "expired" };
    }

    // De rol nu pas opzoeken. Wie tussen aanvragen en klikken uit de lijst
    // gehaald is, komt er niet meer in.
    const role = roleFor(row.email);
    if (!role) return { ok: false, reason: "unknown" };

    // Afstempelen met de voorwaarde er nog een keer bij: klikt iemand twee keer
    // tegelijk, dan raakt precies één van die twee de rij.
    const claimed = (await sql`
      UPDATE portal_login_tokens
      SET used_at = now()
      WHERE id = ${row.id} AND used_at IS NULL
      RETURNING id
    `) as { id: number }[];

    if (claimed.length === 0) return { ok: false, reason: "used" };

    await log({ actor: row.email, action: "login.ok" });
    return { ok: true, email: row.email, role };
  } catch (error) {
    console.error("[beheer] inloglink niet gecontroleerd:", error);
    return { ok: false, reason: "error" };
  }
}
