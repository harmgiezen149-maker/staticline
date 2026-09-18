import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Shell } from "@/components/beheer/Shell";
import { SubscriberRow } from "@/components/beheer/SubscriberRow";
import { getSession } from "@/lib/portal/session";
import { list } from "@/lib/portal/subscribers";

export const metadata: Metadata = { title: "Nieuwsbrief" };

export default async function NieuwsbriefPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  const subscribers = await list();
  const confirmed = subscribers.filter((row) => row.confirmed_at).length;
  const pending = subscribers.length - confirmed;
  const isAdmin = session.role === "admin";

  return (
    <Shell session={session} title="Nieuwsbrief">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <p className="font-mono text-12 uppercase">
            {confirmed} bevestigd
            <span className="text-faint"> · </span>
            <span className={pending > 0 ? "text-primary" : "text-faint"}>
              {pending} nog niet
            </span>
          </p>
          {pending > 2 && (
            <p className="text-muted">
              Meerdere aanmeldingen wachten nog op bevestiging. Als dat er veel
              blijven, komt de bevestigingsmail waarschijnlijk niet aan — kijk
              dan bij Resend of er iets bounced.
            </p>
          )}
        </section>

        {isAdmin && (
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-11 text-faint uppercase">Uitvoeren</h2>
            <p className="text-muted">
              Alleen bevestigde adressen mogen aangeschreven worden. Dat is de
              eerste lijst; de tweede is om te controleren, niet om te mailen.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/api/beheer/nieuwsbrief"
                className="border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary"
              >
                Bevestigde adressen
              </a>
              <a
                href="/api/beheer/nieuwsbrief?alles=1"
                className="font-mono text-12 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
              >
                Alles, ook onbevestigd
              </a>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">Aanmeldingen</h2>
          {subscribers.length === 0 ? (
            <p className="text-muted">Nog niemand aangemeld.</p>
          ) : (
            <ul className="flex flex-col">
              {subscribers.map((row) => (
                <SubscriberRow
                  key={row.id}
                  id={row.id}
                  email={row.email}
                  locale={row.locale}
                  confirmedAt={row.confirmed_at}
                  createdAt={row.created_at}
                  canRemove={isAdmin}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}
