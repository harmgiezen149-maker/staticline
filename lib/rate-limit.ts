/**
 * Een teller per afzender, in het geheugen van de route.
 *
 * Dit is een drempel en geen muur, en dat hoort er expliciet bij te staan: op
 * Vercel begint elke koude start met een lege teller, dus wie geduld heeft komt
 * er langs. Het houdt tegen wat het moet tegenhouden — een formulier dat in een
 * paar seconden twintig keer wordt afgevuurd — en daar is het genoeg voor.
 *
 * Dezelfde aanpak als in de Band App (lib/booking.js daar). Een echte begrenzer
 * zou gedeelde opslag nodig hebben, en dat is meer beheerlast dan dit probleem
 * verdient bij een bandsite.
 */
export function makeLimiter({
  max = 5,
  windowMs = 60 * 60 * 1000,
}: { max?: number; windowMs?: number } = {}) {
  const seen = new Map<string, number[]>();

  return (key: string, now = Date.now()): boolean => {
    const fresh = (seen.get(key) ?? []).filter((t) => now - t < windowMs);

    if (fresh.length >= max) {
      seen.set(key, fresh);
      return false;
    }

    fresh.push(now);
    seen.set(key, fresh);

    // Oude sleutels opruimen, zodat de map niet blijft groeien op een instantie
    // die lang blijft leven.
    if (seen.size > 500) {
      for (const [k, v] of seen) {
        if (!v.some((t) => now - t < windowMs)) seen.delete(k);
      }
    }

    return true;
  };
}
