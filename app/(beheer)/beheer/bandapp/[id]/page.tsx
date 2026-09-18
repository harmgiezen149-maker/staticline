import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GigForm } from "@/components/beheer/GigForm";
import { Shell } from "@/components/beheer/Shell";
import { fetchEditable } from "@/lib/portal/band-app-write";
import { getSession } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Show" };

export default async function ShowPage({
  params,
}: PageProps<"/beheer/bandapp/[id]">) {
  const session = await getSession();
  if (!session) redirect("/beheer/login");
  if (session.role !== "admin") redirect("/beheer/bandapp");

  const { id } = await params;
  const data = await fetchEditable();
  const gig = data?.gigs.find((row) => row.id === Number(id));
  if (!gig) notFound();

  // De Band App geeft één moment terug; het formulier wil een datum en een tijd
  // apart. Splitsen op de UTC-onderdelen, want zo is de kloktijd van de band daar
  // bewaard — zie CLAUDE.md over de tijdzone.
  const moment = gig.startsAt ? new Date(gig.startsAt) : null;
  const date = moment ? moment.toISOString().slice(0, 10) : "";
  const time = moment ? moment.toISOString().slice(11, 16) : "";

  return (
    <Shell session={session} title={gig.title}>
      <div className="flex flex-col gap-8">
        <Link
          href="/beheer/bandapp"
          className="self-start font-mono text-12 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
        >
          Terug naar de agenda
        </Link>

        <GigForm
          gig={{
            id: gig.id,
            date,
            time,
            title: gig.title,
            venue: gig.venue,
            city: gig.city,
            publicStatus: gig.publicStatus,
            ticketUrl: gig.ticketUrl,
            publicNote: gig.publicNote,
            lat: gig.lat === null ? "" : String(gig.lat),
            lng: gig.lng === null ? "" : String(gig.lng),
          }}
        />
      </div>
    </Shell>
  );
}
