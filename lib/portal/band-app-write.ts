import "server-only";

/**
 * Schrijven naar de Band App.
 *
 * De site las tot nu toe alleen: `/api/public`, één GET, geen sleutel. Voor
 * schrijven ligt dat anders, en de weg ernaartoe is met opzet smal.
 *
 * De Band App kent alleen zijn eigen sessiekoekje, en dat staat op zijn eigen
 * domein. Een browser op staticline.nl heeft dat niet. Daarom is er in die app
 * een aparte route bijgekomen, `/api/site`, met een gedeelde sleutel in de
 * Authorization-kop — dezelfde opzet als de cron-route die daar al stond.
 *
 * Wat hier níét gebeurt, is rekenen. De Band App houdt afgeleide velden bij
 * (`mon`/`day`/`time`/`past` naast `startsAt`) en die horen daar berekend te
 * worden, met de helpers die zijn eigen schermen ook gebruiken. Deze site stuurt
 * alleen wat de beheerder invulde. Zie CLAUDE.md over waarom rechtstreeks
 * schrijven die velden stil zou breken.
 *
 * Wie de wijziging deed komt in het logboek van deze site, niet in de Band App.
 * Hier zit de inlog, hier is bekend welk bandlid het was, en dat scheelt daar
 * kolommen.
 */

const BASE_URL = (
  process.env.BAND_APP_URL || "https://static-line-bandapp.vercel.app"
).replace(/\/$/, "");

/** Of de koppeling ingesteld is. Zonder sleutel blijft het scherm leesbaar. */
export function writeConfigured(): boolean {
  return (process.env.SITE_API_TOKEN?.trim().length ?? 0) >= 32;
}

export type EditableGig = {
  id: number;
  startsAt: string | null;
  title: string;
  venue: string;
  city: string;
  publicStatus: string;
  ticketUrl: string;
  publicNote: string;
  lat: number | null;
  lng: number | null;
};

export type EditableBand = {
  name: string;
  bio: string | null;
  logoUrl: string | null;
};

function headers(): HeadersInit {
  return {
    authorization: `Bearer ${process.env.SITE_API_TOKEN?.trim() ?? ""}`,
    "content-type": "application/json",
  };
}

/**
 * Wat er nu in de Band App staat.
 *
 * `cache: "no-store"`: dit is een beheerscherm. De publieke kant mag vijf minuten
 * achterlopen, maar wie net iets gewijzigd heeft hoort zijn eigen wijziging te
 * zien en niet een antwoord van een minuut geleden.
 */
export async function fetchEditable(): Promise<{
  band: EditableBand | null;
  gigs: EditableGig[];
} | null> {
  if (!writeConfigured()) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/site`, {
      headers: headers(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[band-app] /api/site gaf ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { band: EditableBand | null; gigs: EditableGig[] };
    if (!data || !Array.isArray(data.gigs)) {
      console.error("[band-app] /api/site gaf een onverwachte vorm");
      return null;
    }

    return data;
  } catch (error) {
    console.error("[band-app] /api/site niet bereikbaar:", error);
    return null;
  }
}

export type WriteResult =
  | { ok: true }
  | { ok: false; error: "not-configured" | "unreachable" | string };

/**
 * Een wijziging doorsturen.
 *
 * Gooit nooit. De aanroeper krijgt een uitkomst en beslist wat die betekent —
 * dezelfde afspraak als bij lib/mail.ts en lib/db.ts.
 */
export async function write(
  action: string,
  payload: Record<string, unknown>,
): Promise<WriteResult> {
  if (!writeConfigured()) return { ok: false, error: "not-configured" };

  try {
    const res = await fetch(`${BASE_URL}/api/site`, {
      method: "POST",
      headers: headers(),
      cache: "no-store",
      body: JSON.stringify({ action, ...payload }),
    });

    if (res.ok) return { ok: true };

    const body = (await res.json().catch(() => ({}))) as { error?: string };
    console.error(`[band-app] ${action} gaf ${res.status}:`, body.error);
    return { ok: false, error: body.error ?? `status-${res.status}` };
  } catch (error) {
    console.error(`[band-app] ${action} niet verstuurd:`, error);
    return { ok: false, error: "unreachable" };
  }
}

/**
 * De stand van een aantal boekingsaanvragen, zoals de Band App hem kent.
 *
 * De Band App is de baas over die stand. Daar komt de pushmelding binnen en
 * daar kijkt de band; deze site bewaart het uitgebreide archief maar volgt de
 * stand. Zie lib/portal/booking-sync.ts voor hoe dat samenkomt.
 *
 * `null` als de Band App niet bereikbaar is of de koppeling niet ingesteld is.
 * De aanroeper laat dan de laatst bekende stand staan — een beheerscherm dat
 * leeg blijft omdat een andere applicatie hapert, is erger dan een scherm met
 * een regel eronder dat het even niet ververst kon worden.
 */
export async function fetchBookingStatuses(
  ids: number[],
): Promise<Record<number, string> | null> {
  if (!writeConfigured() || ids.length === 0) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/site`, {
      method: "POST",
      headers: headers(),
      cache: "no-store",
      body: JSON.stringify({ action: "booking.statuses", ids }),
    });

    if (!res.ok) {
      console.error(`[band-app] booking.statuses gaf ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { statuses?: Record<string, string> };
    if (!data?.statuses || typeof data.statuses !== "object") {
      console.error("[band-app] booking.statuses gaf een onverwachte vorm");
      return null;
    }

    // De sleutels komen als tekst uit JSON; hier weer als getal, zodat de
    // aanroeper met het id uit de database kan opzoeken.
    return Object.fromEntries(
      Object.entries(data.statuses).map(([id, status]) => [Number(id), String(status)]),
    );
  } catch (error) {
    console.error("[band-app] booking.statuses niet bereikbaar:", error);
    return null;
  }
}
