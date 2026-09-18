import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BandForm } from "@/components/beheer/BandForm";
import { GigForm } from "@/components/beheer/GigForm";
import { Shell } from "@/components/beheer/Shell";
import { fetchEditable, writeConfigured } from "@/lib/portal/band-app-write";
import { getSession } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Band App" };

/**
 * De Band App vanaf de website bijwerken.
 *
 * Dit is de kant die docs/01-scope.md "bewerken van twee kanten" noemt, en die
 * daar als besluit staat opgeschreven: de beheerder is beheerder, en beheren met
 * alleen leesrechten is geen beheren.
 *
 * Wat hier staat is géén kopie. De bio en de agenda die je hier aanpast zijn
 * dezelfde rijen die de band op de repetitie in de app ziet. Er is dus geen
 * tweede waarheid, en niets om te synchroniseren — dat was precies de reden dat
 * er geen sync-laag gebouwd is.
 *
 * Alleen shows. Setlists, riders en podiumplannen zitten er bewust niet in: die
 * worden in de app zelf bijgehouden, vaak op een telefoon tijdens een repetitie,
 * en een tweede scherm ervoor levert niets op.
 */
export default async function BandAppPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  if (session.role !== "admin") {
    return (
      <Shell session={session} title="Band App">
        <p className="text-muted">
          Alleen een beheerder kan de Band App vanaf hier bijwerken.
        </p>
      </Shell>
    );
  }

  if (!writeConfigured()) {
    return (
      <Shell session={session} title="Band App">
        <div className="flex flex-col gap-3">
          <p className="text-muted">
            De koppeling is nog niet ingesteld. Er moet een{" "}
            <span className="font-mono text-12">SITE_API_TOKEN</span> staan bij
            dit project én bij het project van de Band App, met dezelfde waarde.
          </p>
          <p className="text-muted">
            Zie <span className="font-mono text-12">docs/07-instellen.md</span>{" "}
            hoofdstuk 7.
          </p>
        </div>
      </Shell>
    );
  }

  const data = await fetchEditable();

  if (!data) {
    return (
      <Shell session={session} title="Band App">
        <p className="text-danger">
          De Band App antwoordde niet zoals verwacht. Staat{" "}
          <span className="font-mono text-12">SITE_API_TOKEN</span> daar op
          dezelfde waarde, en is de schrijfroute er al? De logs van Vercel zeggen
          wat er misging.
        </p>
      </Shell>
    );
  }

  return (
    <Shell session={session} title="Band App">
      <div className="flex flex-col gap-10">
        <p className="text-muted">
          Wat je hier aanpast staat meteen in de Band App. Het zijn dezelfde
          gegevens die de band op de repetitie ziet — geen kopie.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">De band</h2>
          <BandForm
            name={data.band?.name ?? ""}
            bio={data.band?.bio ?? ""}
            logoUrl={data.band?.logoUrl ?? ""}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">Agenda</h2>
          {data.gigs.length === 0 ? (
            <p className="text-muted">Nog geen shows.</p>
          ) : (
            <ul className="flex flex-col">
              {data.gigs.map((gig) => (
                <li key={gig.id} className="border-b border-line-default">
                  <Link
                    href={`/beheer/bandapp/${gig.id}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 transition-colors duration-[120ms] hover:text-accent"
                  >
                    <span className="font-mono text-12 text-faint">
                      {formatDate(gig.startsAt)}
                    </span>
                    <span className="font-display text-18 font-bold tracking-tight2 uppercase">
                      {gig.title}
                    </span>
                    {(gig.venue || gig.city) && (
                      <span className="text-muted">
                        {[gig.venue, gig.city].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">
            Show toevoegen
          </h2>
          <GigForm />
        </section>
      </div>
    </Shell>
  );
}

/**
 * De datum van een show.
 *
 * Op UTC, niet op Europe/Amsterdam. De Band App bewaart de kloktijd van de band
 * als UTC-onderdelen, bewust zonder zomertijd: 20:00 staat als 20:00Z en betekent
 * 20:00 op de klok in de zaal. Formatteren op de Nederlandse tijdzone zet elke
 * show in de zomer een uur verkeerd. Zie CLAUDE.md.
 */
function formatDate(value: string | null): string {
  if (!value) return "geen datum";
  return new Date(value).toLocaleString("nl-NL", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
