import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/beheer/Shell";
import {
  type Status,
  STATUSES,
  STATUS_LABELS,
  counts,
  isStatus,
  list,
} from "@/lib/portal/bookings";
import { getSession } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Boekingen" };

/**
 * Wanneer een aanvraag binnenkwam.
 *
 * Hier wél Europe/Amsterdam, anders dan overal waar de Band App langskomt. Dat
 * verschil is opzettelijk: `created_at` is een echt moment in de tijd, en de
 * tijden uit de Band App zijn kloktijden van de band die bewust zonder zomertijd
 * bewaard worden. Zie CLAUDE.md.
 */
const when = (value: string) =>
  new Date(value).toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    dateStyle: "short",
    timeStyle: "short",
  });

export default async function BoekingenPage({
  searchParams,
}: PageProps<"/beheer/boekingen">) {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  const params = await searchParams;
  const filter: Status | undefined = isStatus(params.status)
    ? params.status
    : undefined;

  const [bookings, totals] = await Promise.all([list(filter), counts()]);
  const all = Object.values(totals).reduce((sum, n) => sum + n, 0);

  return (
    <Shell session={session} title="Boekingen">
      <div className="flex flex-col gap-6">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Filter href="/beheer/boekingen" active={!filter} label="Alles" count={all} />
          {STATUSES.map((status) => (
            <Filter
              key={status}
              href={`/beheer/boekingen?status=${status}`}
              active={filter === status}
              label={STATUS_LABELS[status]}
              count={totals[status] ?? 0}
            />
          ))}
        </nav>

        {bookings.length === 0 ? (
          <p className="text-muted">
            {filter
              ? "Niets met deze status."
              : "Nog geen aanvragen binnengekomen."}
          </p>
        ) : (
          <ul className="flex flex-col">
            {bookings.map((booking) => (
              <li key={booking.id} className="border-b border-line">
                <Link
                  href={`/beheer/boekingen/${booking.id}`}
                  className="flex flex-col gap-1 py-3 transition-colors duration-[120ms] hover:text-accent"
                >
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-18 font-bold tracking-tight2 uppercase">
                      {booking.name}
                    </span>
                    <span className="font-mono text-11 text-faint uppercase">
                      {booking.kind === "booking" ? "Boeking" : "Vraag"}
                      {" · "}
                      {STATUS_LABELS[booking.status as Status] ?? booking.status}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-x-3 text-muted">
                    <span>{when(booking.created_at)}</span>
                    {booking.wanted_date && <span>· {booking.wanted_date}</span>}
                    {booking.location && <span>· {booking.location}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function Filter({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`font-mono text-12 uppercase transition-colors duration-[120ms] ${
        active ? "text-accent" : "text-muted hover:text-primary"
      }`}
    >
      {label} <span className="text-faint">{count}</span>
    </Link>
  );
}
