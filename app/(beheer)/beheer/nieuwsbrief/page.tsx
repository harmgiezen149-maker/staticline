import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AnnounceShow } from "@/components/beheer/AnnounceShow";
import { Shell } from "@/components/beheer/Shell";
import {
  type Announcement,
  announcementsReady,
  autoEnabled,
  listAnnouncements,
  pendingShows,
  ROUND,
} from "@/lib/announce";
import { showName } from "@/lib/announce-mail";
import { formatShowDateLong } from "@/lib/i18n";
import { SubscriberRow } from "@/components/beheer/SubscriberRow";
import { getSession } from "@/lib/portal/session";
import { list } from "@/lib/portal/subscribers";

import { toggleAuto } from "./actions";

export const metadata: Metadata = { title: "Nieuwsbrief" };

export default async function NieuwsbriefPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  const subscribers = await list();
  const confirmed = subscribers.filter((row) => row.confirmed_at).length;
  const pending = subscribers.length - confirmed;
  const isAdmin = session.role === "admin";

  // Alleen voor een beheerder: die mag versturen, en zonder die rechten hoeft
  // de Band App ook niet gevraagd te worden wat er in de agenda staat.
  const ready = isAdmin && (await announcementsReady());
  const [auto, waiting, history] = ready
    ? await Promise.all([autoEnabled(), pendingShows(), listAnnouncements()])
    : [false, [], [] as Announcement[]];

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
            <h2 className="font-mono text-11 text-faint uppercase">
              Uitvoeren
            </h2>
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

        {isAdmin && (
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-11 text-faint uppercase">
              Nieuwe shows aankondigen
            </h2>
            {!ready ? (
              <p className="text-muted">
                Hiervoor is een nieuwe tabel nodig. Draai eerst{" "}
                <a
                  href="/beheer/database"
                  className="underline hover:text-primary"
                >
                  de database-update
                </a>
                ; daarna staat hier wat er gemaild wordt.
              </p>
            ) : (
              <>
                <p className="text-muted">
                  Elke ochtend tussen 9 en 11 uur kijkt de site of er een nieuwe show in
                  de agenda staat, en mailt die één keer naar de {confirmed}{" "}
                  bevestigde adressen, ieder in zijn eigen taal. Een show die je
                  vandaag invoert, gaat dus morgenochtend de deur uit — tot die
                  tijd kun je hem hieronder overslaan, meteen versturen of eerst
                  naar jezelf sturen.
                </p>
                <form
                  action={toggleAuto}
                  className="flex flex-wrap items-center gap-4"
                >
                  <input type="hidden" name="on" value={auto ? "0" : "1"} />
                  <span className="font-mono text-12 uppercase">
                    Automatisch versturen:{" "}
                    <span className={auto ? "text-accent-alt" : "text-danger"}>
                      {auto ? "aan" : "uit"}
                    </span>
                  </span>
                  <button
                    type="submit"
                    className="cursor-pointer font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
                  >
                    {auto ? "Uitzetten" : "Aanzetten"}
                  </button>
                </form>

                <h3 className="mt-2 font-mono text-11 text-faint uppercase">
                  {auto
                    ? "Gaat mee in de volgende ronde"
                    : "Nog niet aangekondigd"}
                </h3>
                {waiting.length === 0 ? (
                  <p className="text-muted">
                    Niets nieuws: elke show in de agenda is al aan de beurt
                    geweest.
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {waiting.map((show) => (
                      <AnnounceShow
                        key={show.id}
                        id={show.id}
                        title={showName(show)}
                        meta={[formatShowDateLong(show.date, "nl"), show.time]
                          .filter(Boolean)
                          .join(" · ")}
                        canSkip
                        sendLabel="Nu versturen"
                        confirmText={`"${showName(show)}" nu naar ${confirmed} adressen mailen? Dat is niet terug te draaien.`}
                      />
                    ))}
                  </ul>
                )}

                {history.length > 0 && (
                  <>
                    <h3 className="mt-2 font-mono text-11 text-faint uppercase">
                      Eerder
                    </h3>
                    <ul className="flex flex-col">
                      {history.map((row) => (
                        <HistoryRow
                          key={row.show_id}
                          row={row}
                          confirmed={confirmed}
                        />
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">
            Aanmeldingen
          </h2>
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

const STATUS: Record<Announcement["status"], string> = {
  baseline: "stond er al bij de eerste ronde",
  sending: "wordt verstuurd",
  sent: "verstuurd",
  skipped: "overgeslagen",
  failed: "versturen mislukt",
};

/**
 * Een show die al aan de beurt is geweest.
 *
 * Wat niet verstuurd is (stond er al, overgeslagen, mislukt) kan met de hand
 * alsnog, zolang de show nog in de agenda staat. Wat verstuurd is, nooit twee
 * keer.
 */
function HistoryRow({
  row,
  confirmed,
}: {
  row: Announcement;
  confirmed: number;
}) {
  const when = new Date(row.sent_at ?? row.created_at).toLocaleDateString(
    "nl-NL",
    {
      timeZone: "Europe/Amsterdam",
    },
  );
  const who = row.actor === ROUND ? "ochtendronde" : row.actor;
  const meta = [
    STATUS[row.status],
    row.status === "sent" ? `${row.recipients} adressen` : null,
    when,
    who,
  ]
    .filter(Boolean)
    .join(" · ");

  if (["baseline", "skipped", "failed"].includes(row.status)) {
    return (
      <AnnounceShow
        id={Number(row.show_id)}
        title={row.label}
        meta={meta}
        canSkip={row.status !== "skipped"}
        sendLabel="Alsnog versturen"
        confirmText={`"${row.label}" alsnog naar ${confirmed} adressen mailen? Dat is niet terug te draaien.`}
      />
    );
  }

  return (
    <li className="flex flex-wrap items-baseline gap-x-3 border-b border-line py-3">
      <span className="font-display text-16 font-semibold uppercase">
        {row.label}
      </span>
      <span className="font-mono text-11 text-faint uppercase">{meta}</span>
    </li>
  );
}
