import "server-only";

/**
 * Cloudflare Turnstile.
 *
 * Gratis, zet geen cookies waar een banner voor nodig is, en werkt zonder dat een
 * bezoeker verkeerslichten hoeft aan te wijzen.
 *
 * Zonder sleutels doet dit niets en laat het alles door. Dat is met opzet: het
 * formulier moet werken voordat iemand een account bij Cloudflare heeft
 * aangemaakt, en de honeypot in lib/booking.ts vangt ondertussen het meeste weg.
 * Er wordt wél een waarschuwing gelogd, zodat het niet stilletjes zo blijft.
 *
 * Instellen: maak een site op https://dash.cloudflare.com/?to=/:account/turnstile
 * en zet de twee sleutels in de omgevingsvariabelen van het Vercel-project:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — mag publiek, staat in de HTML
 *   TURNSTILE_SECRET_KEY          — geheim, alleen server
 */
const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

export async function verifyTurnstile(
  token: unknown,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn(
      "[turnstile] geen TURNSTILE_SECRET_KEY ingesteld — captcha wordt overgeslagen",
    );
    return true;
  }

  if (typeof token !== "string" || !token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) {
      console.error(`[turnstile] siteverify gaf ${res.status}`);
      return false;
    }

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    // Cloudflare onbereikbaar. Weigeren zou betekenen dat een storing daar de
    // boekingen hier stilzet, en boekingen zijn het doel van de site; de honeypot
    // en de snelheidsbegrenzer blijven wel staan.
    console.error("[turnstile] niet bereikbaar, aanvraag toch doorgelaten:", error);
    return true;
  }
}
