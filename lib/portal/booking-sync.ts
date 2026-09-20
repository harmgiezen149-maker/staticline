import "server-only";

/**
 * De stand van een boekingsaanvraag, op één plek.
 *
 * Een aanvraag via het boekingsformulier komt op twee plekken terecht. Hier, met
 * alle elf velden, als archief waar je later in kunt zoeken. En in de Band App,
 * waar de band er een pushmelding van krijgt en hem afhandelt.
 *
 * Allebei hielden ze hun eigen stand bij, en die liepen stil uit elkaar: zette
 * je een aanvraag in de app op "geboekt", dan stond hij hier nog op "nieuw".
 * Twee postvakken die niet van elkaar weten is erger dan één postvak minder.
 *
 * **De Band App is de baas.** Daar komt de melding binnen en daar kijkt de band
 * het eerst. Wat hier in `status` staat is sindsdien een afspiegeling, bijgewerkt
 * zodra dit scherm geopend wordt. Schrijven gaat de andere kant op: eerst naar
 * de Band App, en pas als dat lukt ook hier.
 *
 * Waarom een afspiegeling en niet elke keer opvragen: het lijstscherm filtert en
 * telt met SQL. Die twee opdrachten omschrijven naar iets dat een lijst uit een
 * andere applicatie sorteert, zou voor honderd aanvragen per jaar veel werk zijn
 * om precies hetzelfde te krijgen.
 *
 * Wat er niet gekoppeld is, blijft van hier. Aanvragen van vóór deze koppeling
 * en aanvragen die de Band App nooit bereikt hebben, hebben geen `band_app_id`;
 * die houden hun eigen stand en zijn hier gewoon bij te werken.
 */

import { fetchBookingStatuses, write, writeConfigured } from "./band-app-write";
import { changedStatuses, type Status } from "./booking-status";
import { linked, mirrorStatus } from "./bookings";

/**
 * Hoe het bijtrekken afliep.
 *
 * Drie uitkomsten en geen `boolean`, omdat "niet ingesteld" iets anders is dan
 * "niet bereikbaar". Het eerste is een keuze — de koppeling staat er gewoon niet
 * — en daar hoort geen storingsmelding bij. Het tweede is wél iets wat je moet
 * weten voordat je naar een lijst kijkt.
 */
export type SyncState = "bijgewerkt" | "onbereikbaar" | "uit";

export type SyncResult = {
  state: SyncState;
  /** Hoeveel aanvragen er een andere stand bleken te hebben. */
  changed: number;
};

/**
 * De standen ophalen bij de Band App en overnemen wat er afwijkt.
 *
 * Aan te roepen vóór het lezen van de lijst, zodat een filter op "nieuw" ook
 * echt de aanvragen toont die daar nog op "nieuw" staan.
 *
 * Gooit nooit. Is de Band App onbereikbaar, dan blijft alles staan zoals het
 * stond en zegt de aanroeper dat erbij — een beheerscherm dat leegblijft omdat
 * een andere applicatie hapert, is erger dan een scherm met een regel eronder.
 */
export async function syncStatuses(): Promise<SyncResult> {
  if (!writeConfigured()) return { state: "uit", changed: 0 };

  const rows = await linked();
  if (rows.length === 0) return { state: "bijgewerkt", changed: 0 };

  const statuses = await fetchBookingStatuses(rows.map((row) => row.band_app_id));
  if (!statuses) return { state: "onbereikbaar", changed: 0 };

  // Het uitzoeken zelf staat in booking-status.ts, zodat het na te rekenen is
  // zonder database. Zie lib/portal/booking-sync.test.ts.
  const anders = changedStatuses(rows, statuses);

  await Promise.all(anders.map((row) => mirrorStatus(row.id, row.status)));

  return { state: "bijgewerkt", changed: anders.length };
}

export type PushResult = { ok: true } | { ok: false; message: string };

/**
 * Een nieuwe stand doorgeven aan de Band App.
 *
 * Eerst daar, dan hier. Andersom zou een mislukte aanroep precies opleveren wat
 * deze hele module moet voorkomen: een stand die hier anders staat dan daar.
 */
export async function pushStatus(
  bandAppId: number,
  status: Status,
): Promise<PushResult> {
  const result = await write("booking.status", { id: bandAppId, status });
  if (result.ok) return { ok: true };

  if (result.error === "not-configured") {
    return {
      ok: false,
      message: "De koppeling met de Band App is niet ingesteld (SITE_API_TOKEN).",
    };
  }
  if (result.error === "not-found") {
    return {
      ok: false,
      message: "Deze aanvraag bestaat niet meer in de Band App. Daar is hij weggegooid.",
    };
  }
  return {
    ok: false,
    message: "De Band App is niet bereikbaar, dus de stand is nergens gewijzigd.",
  };
}
