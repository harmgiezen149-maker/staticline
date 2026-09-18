import "server-only";

/**
 * Het adres waar deze site op staat.
 *
 * Nodig zodra er een link in een mail moet: een relatief pad is daar
 * onbruikbaar. `SITE_URL` staat als omgevingsvariabele in Vercel, zodat een
 * bevestigingslink op een previewdeploy naar die preview wijst en niet naar
 * productie.
 *
 * De standaardwaarde is het canonieke adres met `www`. Dat is bewust: de apex
 * `staticline.nl` stuurt met een 308 door naar `www`, en een mailclient die een
 * omleiding niet volgt hoort niet de reden te zijn dat een aanmelding strandt.
 */
const FALLBACK = "https://www.staticline.nl";

export function siteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");

  // Vercel zet dit zelf op elke deploy, inclusief previews. Alleen de hostnaam,
  // zonder schema.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return FALLBACK;
}
