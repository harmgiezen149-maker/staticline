import { redirect } from "next/navigation";

import { InstallButton } from "@/components/beheer/InstallButton";
import { Shell } from "@/components/beheer/Shell";
import { bandAppUrl } from "@/lib/band-app";
import { recent } from "@/lib/portal/audit";
import { getSession } from "@/lib/portal/session";

/**
 * Het overzicht.
 *
 * Elk beheerscherm controleert zelf of er een sessie is. Bewust geen proxy of
 * middleware ervoor: die is uit dit project gehaald omdat hij zich op Vercel
 * anders gedroeg dan lokaal, en een routeringslaag die op twee plekken iets
 * anders doet is bij een inlogcontrole nog veel vervelender dan bij een taal.
 * Zie CLAUDE.md.
 */
export default async function BeheerPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  const entries = await recent(15);

  return (
    <Shell session={session} title="Overzicht">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">
            In de Band App
          </h2>
          <p className="text-muted">
            De agenda en de bandgegevens zijn hiervandaan bij te werken, onder
            Band App. Dat zijn dezelfde rijen die de band op de repetitie ziet,
            geen kopie.
          </p>
          <p className="text-muted">
            Setlists, riders, podiumplannen en contacten worden in de app zelf
            bijgehouden. Daar is een tweede scherm voor geen winst.
          </p>
          <a
            href={bandAppUrl()}
            className="self-start border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary"
          >
            Naar de Band App
          </a>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">Op je telefoon</h2>
          <p className="text-muted">
            Dit beheer is te installeren als app. Dan staat het met een eigen
            icoon op je beginscherm en opent het zonder adresbalk, net als de
            Band App. Het werkt verder hetzelfde en heeft bereik nodig.
          </p>
          <InstallButton />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">Logboek</h2>
          {entries.length === 0 ? (
            <p className="text-muted">Nog niets gebeurd.</p>
          ) : (
            <ul className="flex flex-col">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line py-2"
                >
                  <time
                    dateTime={entry.created_at}
                    className="font-mono text-11 text-faint uppercase"
                  >
                    {new Date(entry.created_at).toLocaleString("nl-NL", {
                      timeZone: "Europe/Amsterdam",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                  <span className="font-mono text-12">{entry.action}</span>
                  <span className="text-muted">{entry.actor}</span>
                  {entry.detail && (
                    <span className="text-muted">— {entry.detail}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}
