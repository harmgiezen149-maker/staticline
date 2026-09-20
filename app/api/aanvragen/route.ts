import { NextResponse } from "next/server";

import { authorized } from "@/lib/portal/api-token";
import { log } from "@/lib/portal/audit";
import { filledBookingRows } from "@/lib/portal/booking-fields";
import { byBandAppIds, setNoteByBandAppId } from "@/lib/portal/bookings";

/**
 * De volledige aanvraag, voor het boekingsscherm in de Band App.
 *
 * De Band App bewaart zes velden van een aanvraag; deze site bewaart er elf,
 * plus de notitie van de band. Dat archief blijft hier — zie CLAUDE.md — maar er
 * was geen reden waarom je er in de app niet bij kon. Nu wel: de app vraagt de
 * details op met het id dat hij zelf kent.
 *
 * De regels komen kant-en-klaar met hun label mee, net als de datums bij de
 * schrijfmodule. Die labels staan in content/nl.ts en horen niet in twee
 * applicaties overgetypt te worden.
 *
 * De notitie blijft hier staan en wordt hier bewerkt. Hem ook in de Band App
 * bewaren zou precies de scheefgroei opleveren die bij de status net is
 * weggehaald: twee kopieën die niet van elkaar weten.
 */
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
const bad = (reason: string) => NextResponse.json({ error: reason }, { status: 400 });

/** Wie de aanroep deed, voor het logboek. Nooit vertrouwd voor rechten. */
const actorOf = (value: unknown) =>
  String(value ?? "bandapp").trim().slice(0, 160) || "bandapp";

function ids(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 500);
}

export async function POST(request: Request) {
  if (!authorized(request)) return deny();

  const body = await request.json().catch(() => ({}));

  switch (body?.action) {
    case "details":
      return details(body);
    case "note":
      return note(body);
    default:
      return bad("unknown-action");
  }
}

/**
 * De details van een aantal aanvragen in één keer.
 *
 * Eén aanroep voor het hele scherm en niet een per kaart: het zijn er hooguit
 * enkele tientallen, en een telefoon die er twintig los ophaalt is trager dan
 * één antwoord dat alles bevat.
 */
async function details(body: { ids?: unknown }) {
  const wanted = ids(body.ids);
  if (wanted.length === 0) return bad("no-ids");

  const bookings = await byBandAppIds(wanted);

  return NextResponse.json({
    details: Object.fromEntries(
      bookings
        .filter((booking) => booking.band_app_id !== null)
        .map((booking) => [
          booking.band_app_id,
          {
            rows: filledBookingRows(booking),
            note: booking.note,
            /**
             * Alleen wat de aanvrager zelf schreef.
             *
             * Wat de Band App als `message` bewaart, is de samengevoegde tekst
             * uit lib/booking.ts: de elf velden achter elkaar, met het eigen
             * bericht eronder. Die velden staan hierboven al netjes in `rows`,
             * dus zonder dit veld zou het scherm alles twee keer tonen.
             */
            message: booking.message,
            // Voor het vooraf invullen van een nieuw agenda-item. Ruw zoals de
            // aanvrager het schreef: "Loburg, Wageningen" hoort niet hier
            // opgeknipt te worden in een zaal en een plaats.
            location: booking.location,
          },
        ]),
    ),
  });
}

/** De notitie van één aanvraag opslaan. */
async function note(body: { id?: unknown; note?: unknown; actor?: unknown }) {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1) return bad("invalid-id");

  const text = String(body.note ?? "").slice(0, 2000);
  const actor = actorOf(body.actor);

  const saved = await setNoteByBandAppId(id, text, `bandapp:${actor}`);
  if (!saved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  await log({
    actor: `bandapp:${actor}`,
    action: "booking.note",
    subject: String(id),
    detail: text ? `${text.length} tekens` : "leeggemaakt",
  });

  return NextResponse.json({ ok: true });
}
