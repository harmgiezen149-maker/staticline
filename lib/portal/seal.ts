import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Het ondertekenen en controleren van het sessiekoekje.
 *
 * Los van session.ts, dat `server-only` importeert en daardoor niet te testen is
 * in een gewone node-test. Dezelfde reden als bij lib/mail-html.ts: wat de
 * moeite van een test waard is, hoort niet vast te zitten aan een module die
 * alleen op de server geladen kan worden. En dit ís die moeite waard — het is
 * het enige dat tussen een willekeurige bezoeker en het beheerscherm staat.
 *
 * De sleutel komt hier als argument binnen in plaats van uit process.env, zodat
 * een test hem kan meegeven zonder de omgeving aan te passen.
 */

export type Sealed = {
  email: string;
  /** Wanneer dit koekje vervalt, in milliseconden sinds 1970. */
  exp: number;
};

/** De minimale lengte van PORTAL_SECRET. Korter is een raadbare sleutel. */
export const MIN_SECRET_LENGTH = 32;

function mac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function seal(value: Sealed, secret: string): string {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${mac(payload, secret)}`;
}

/**
 * Een koekje controleren. `null` bij elke twijfel.
 *
 * De vergelijking gaat via `timingSafeEqual`. Een gewone `===` stopt bij het
 * eerste verschillende teken, en uit hoe lang dat duurt is af te leiden hoeveel
 * tekens klopten — daarmee is een handtekening teken voor teken te raden in
 * plaats van in één keer.
 */
export function unseal(token: string, secret: string): Sealed | null {
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;

  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;

  const payload = token.slice(0, dot);
  const expected = Buffer.from(mac(payload, secret), "base64url");

  let given: Buffer;
  try {
    given = Buffer.from(token.slice(dot + 1), "base64url");
  } catch {
    return null;
  }

  // Lengte eerst: timingSafeEqual gooit op ongelijke lengtes.
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(given, expected)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const { email, exp } = parsed as Partial<Sealed>;
  if (typeof email !== "string" || !email) return null;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  if (exp < Date.now()) return null;

  return { email, exp };
}
