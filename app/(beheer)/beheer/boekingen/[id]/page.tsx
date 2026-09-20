import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BookingEditor } from "@/components/beheer/BookingEditor";
import { Shell } from "@/components/beheer/Shell";
import { getCopy } from "@/content";
import { syncStatuses } from "@/lib/portal/booking-sync";
import { type Status, STATUS_LABELS, get } from "@/lib/portal/bookings";
import { getSession } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Aanvraag" };

/**
 * Eén aanvraag, met alles wat er ingevuld is.
 *
 * De labels komen uit content/nl.ts, dezelfde die de bezoeker op het formulier
 * zag. Ze hier opnieuw intypen zou betekenen dat "Grootte van de ruimte" ooit
 * op de ene plek verandert en op de andere niet.
 */
const copy = getCopy("nl");
const fields = copy.booking.fields;
const choices = copy.booking.choice;

const CHOICE_LABELS: Record<string, string> = {
  yes: choices.yes,
  no: choices.no,
  unknown: choices.unknown,
  rent: choices.rent,
};

export default async function AanvraagPage({
  params,
}: PageProps<"/beheer/boekingen/[id]">) {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  // Ook hier bijtrekken en niet alleen op de lijst: dit adres is los te
  // openen, uit een bladwijzer of een link. Dan hoort er te staan wat de band
  // ziet, niet wat hier het laatst bewaard werd.
  const sync = await syncStatuses();

  // In Next 16 is params een promise.
  const { id } = await params;
  const booking = await get(Number(id));
  if (!booking) notFound();

  const isBooking = booking.kind === "booking";

  const rows: [string, string][] = [
    [fields.email, booking.email],
    [fields.phone, booking.phone],
    ...(isBooking
      ? ([
          [fields.date, booking.wanted_date],
          [fields.location, booking.location],
          [fields.time, booking.wanted_time],
          [fields.duration, booking.duration],
          [fields.eventType, booking.event_type],
          [fields.budget, booking.budget],
          [fields.roomSize, booking.room_size],
          [fields.parking, CHOICE_LABELS[booking.parking] ?? booking.parking],
          [fields.backstage, CHOICE_LABELS[booking.backstage] ?? booking.backstage],
          [fields.pa, CHOICE_LABELS[booking.pa] ?? booking.pa],
        ] as [string, string][])
      : []),
  ];

  return (
    <Shell session={session} title={booking.name}>
      <div className="flex flex-col gap-8">
        <Link
          href="/beheer/boekingen"
          className="self-start font-mono text-12 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
        >
          Terug naar de lijst
        </Link>

        <section className="flex flex-col gap-1">
          <p className="font-mono text-11 text-faint uppercase">
            {isBooking ? copy.booking.kindBooking : copy.booking.kindQuestion}
            {" · "}
            {STATUS_LABELS[booking.status as Status] ?? booking.status}
            {" · "}
            binnengekomen{" "}
            {new Date(booking.created_at).toLocaleString("nl-NL", {
              timeZone: "Europe/Amsterdam",
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
          {!booking.forwarded && (
            <p className="text-danger">
              Deze aanvraag is niet bij de Band App aangekomen. Hij staat alleen
              hier.
            </p>
          )}
          {/* Waar de status vandaan komt. Dat is geen detail: het bepaalt of een
              wijziging hier ook in de app zichtbaar wordt, en of de band met
              hetzelfde postvak werkt als jij. */}
          {booking.band_app_id === null ? (
            booking.forwarded && (
              <p className="text-muted">
                Deze aanvraag is niet gekoppeld aan de Band App — hij kwam binnen
                voordat die koppeling bestond. De status hieronder geldt alleen
                hier; in de app heeft hij zijn eigen stand.
              </p>
            )
          ) : sync.state === "onbereikbaar" ? (
            <p className="text-muted">
              De Band App is niet bereikbaar, dus dit is de laatst bekende status.
              Wijzigen kan nu niet.
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">Gegevens</h2>
          <dl className="flex flex-col">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap gap-x-4 border-b border-line py-2"
              >
                <dt className="w-48 shrink-0 text-muted">{label}</dt>
                <dd className={value ? "" : "text-faint"}>
                  {value || "niet ingevuld"}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {booking.message && (
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-11 text-faint uppercase">
              {fields.message}
            </h2>
            {/* Invoer van een bezoeker. `whitespace-pre-wrap` houdt de
                regelovergangen die iemand zelf getypt heeft; React ontsnapt de
                inhoud zelf, dus er gaat hier geen HTML doorheen. */}
            <p className="whitespace-pre-wrap">{booking.message}</p>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">Afhandeling</h2>
          {session.role === "admin" ? (
            <BookingEditor
              id={booking.id}
              status={(booking.status as Status) ?? "new"}
              note={booking.note}
            />
          ) : (
            <>
              <p className="text-muted">
                Alleen een beheerder kan de status wijzigen.
              </p>
              {booking.note && <p className="whitespace-pre-wrap">{booking.note}</p>}
            </>
          )}
          {booking.updated_at && (
            <p className="font-mono text-11 text-faint uppercase">
              Laatst gewijzigd door {booking.updated_by} op{" "}
              {new Date(booking.updated_at).toLocaleString("nl-NL", {
                timeZone: "Europe/Amsterdam",
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}
