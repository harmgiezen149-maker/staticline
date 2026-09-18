import "server-only";

import { cookies } from "next/headers";

import { type Role, roleFor } from "./access";
import { MIN_SECRET_LENGTH, seal as sealValue, unseal as unsealValue } from "./seal";

/**
 * De sessie van het besloten deel.
 *
 * Een koekje met een handtekening eroverheen, ondertekend met PORTAL_SECRET. Geen
 * sessietabel: dan is er niets bij te houden en niets op te ruimen, en de
 * database wordt niet geraadpleegd op elke paginaweergave.
 *
 * Geen `jose` of een andere bibliotheek: dit is een HMAC over een stukje JSON, en
 * daar zit `node:crypto` al voor in Node. Dezelfde afweging als bij de mail, die
 * Resend met een gewone `fetch` aanroept in plaats van met een SDK.
 *
 * De prijs van een koekje zonder tabel is dat het niet in te trekken is: wie
 * ingelogd is, blijft dat tot het verloopt. Bij vier bandleden en dertig dagen is
 * dat te overzien. Moet iemand er per direct uit, dan is PORTAL_SECRET wijzigen
 * het middel — dat zet iedereen in één keer buiten.
 */

const COOKIE = "sl_beheer";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type Session = {
  email: string;
  role: Role;
  /** Wanneer dit koekje vervalt, in milliseconden sinds 1970. */
  exp: number;
};

/**
 * De ondertekensleutel.
 *
 * Geen terugvalwaarde voor ontwikkeling. Een standaardsleutel als
 * "dev-secret-change-me" is precies de soort die ooit ongemerkt in productie
 * belandt, en dan kan iedereen die hem kent een geldig koekje maken.
 */
function key(): string | null {
  const raw = process.env.PORTAL_SECRET?.trim();
  if (!raw || raw.length < MIN_SECRET_LENGTH) return null;
  return raw;
}

/**
 * Een ondertekend koekje maken. `null` als er geen sleutel is.
 *
 * Alleen het adres gaat erin, niet de rol. Zie `unseal`: de rol wordt bij elke
 * paginaweergave opnieuw opgezocht, zodat rechten afnemen meteen werkt.
 */
export function seal(email: string): string | null {
  const secret = key();
  if (!secret) return null;
  return sealValue({ email, exp: Date.now() + MAX_AGE_SECONDS * 1000 }, secret);
}

/**
 * Een koekje controleren. `null` bij elke twijfel.
 *
 * De rol komt uit de omgeving en niet uit het koekje. Anders houdt iemand die uit
 * PORTAL_ADMINS gehaald is zijn rechten tot het koekje verloopt, en dat is niet
 * wat je verwacht als je iemand rechten afneemt.
 */
export function unseal(value: string): Session | null {
  const secret = key();
  if (!secret) return null;

  const opened = unsealValue(value, secret);
  if (!opened) return null;

  const role = roleFor(opened.email);
  if (!role) return null;

  return { email: opened.email, role, exp: opened.exp };
}

/** De huidige sessie, of `null`. Overal waar iets afgeschermd moet worden. */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  return value ? unseal(value) : null;
}

/**
 * Inloggen. Alleen aan te roepen in een route handler of een server action:
 * een koekje zetten kan niet tijdens het renderen van een server component.
 */
export async function startSession(email: string): Promise<boolean> {
  const value = seal(email);
  if (!value) return false;
  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return true;
}

/** Uitloggen. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
