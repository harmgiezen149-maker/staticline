"use client";

import { useState, useTransition } from "react";

import { type AccessResult, grant, revoke } from "@/app/(beheer)/beheer/toegang/actions";
import type { Role } from "@/lib/portal/access";
import type { PortalUser } from "@/lib/portal/users";

/**
 * Toegang tot /beheer geven en intrekken. Zie app/(beheer)/beheer/toegang.
 *
 * Bovenaan wie vast in Vercel staat (niet aan te passen hier), daaronder wie
 * hier is toegevoegd, met per persoon "Maak beheerder" of "Maak lid" en
 * "Toegang intrekken". Onderaan een adres toevoegen.
 */

type Props = {
  me: string;
  fixed: { email: string; role: Role }[];
  /** `null` als de database niet bereikbaar is. */
  users: PortalUser[] | null;
};

const ROLE: Record<Role, string> = { admin: "Beheerder", member: "Lid" };

const input =
  "border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong";
// min-h-11: op een telefoon moet je dit met een duim kunnen raken.
const small =
  "inline-flex min-h-11 items-center font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary disabled:opacity-40";
const primary =
  "inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60";

export function AccessManager({ me, fixed, users }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<AccessResult | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin");

  const run = (action: () => Promise<AccessResult>, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result);
      if (result.ok) after?.();
    });

  function changeRole(user: PortalUser, next: Role) {
    const ask =
      next === "admin"
        ? `${user.email} beheerder maken? Dan kan diegene alles in /beheer aanpassen, ook wie er toegang heeft.`
        : user.email === me
          ? "Je eigen beheerrechten opgeven? Je blijft lid; terugkrijgen kan alleen via een andere beheerder."
          : `${user.email} terugzetten naar lid?`;
    if (!window.confirm(ask)) return;
    run(() => grant(user.email, next));
  }

  function remove(user: PortalUser) {
    const ask =
      user.email === me
        ? "Je eigen toegang intrekken? Je wordt dan meteen buitengesloten."
        : `De toegang van ${user.email} intrekken? Diegene kan dan meteen niet meer in /beheer.`;
    if (!window.confirm(ask)) return;
    run(() => revoke(user.email));
  }

  function add(event: React.FormEvent) {
    event.preventDefault();
    run(() => grant(email, role), () => setEmail(""));
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="text-muted">
        Wie er in /beheer mag. Een <strong className="text-primary">beheerder</strong> kan alles aanpassen, ook wie er
        toegang heeft. Een <strong className="text-primary">lid</strong> kan inloggen en meekijken, en de tone-of-voice
        gebruiken. Inloggen gaat met een link per mail, zonder wachtwoord; een wijziging hier gaat meteen in.
      </p>

      {message && (
        <p role="status" className={message.ok ? "text-muted" : "text-danger"}>
          {message.message}
        </p>
      )}

      {/* ── Toegevoegd in het beheer ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-11 text-faint uppercase">Toegevoegd in het beheer</h2>
        {users === null ? (
          <p className="text-danger">
            De database is niet bereikbaar, dus hier kan nu niemand toegevoegd worden. De vaste lijst hieronder werkt
            gewoon.
          </p>
        ) : users.length === 0 ? (
          <p className="border border-dashed border-line px-4 py-6 text-center text-muted">
            Nog niemand. Voeg hieronder iemand toe.
          </p>
        ) : (
          <ul className="flex flex-col">
            {users.map((user) => (
              <li key={user.email} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line py-3">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">
                    {user.email}
                    {user.email === me && <span className="text-muted"> (jij)</span>}
                  </span>
                  <span className={`font-mono text-12 uppercase ${user.role === "admin" ? "text-accent-alt" : "text-muted"}`}>
                    {ROLE[user.role]}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-4">
                  {user.role === "member" ? (
                    <button type="button" className={small} disabled={pending} onClick={() => changeRole(user, "admin")}>
                      Maak beheerder
                    </button>
                  ) : (
                    <button type="button" className={small} disabled={pending} onClick={() => changeRole(user, "member")}>
                      Maak lid
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${small} hover:text-danger`}
                    disabled={pending}
                    onClick={() => remove(user)}
                  >
                    Toegang intrekken
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Toevoegen ── */}
      {users !== null && (
        <form onSubmit={add} className="flex flex-col gap-4 border border-line p-4">
          <h2 className="font-mono text-11 text-faint uppercase">Iemand toegang geven</h2>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-11 text-faint uppercase">E-mailadres</span>
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              className={input}
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-mono text-11 text-faint uppercase">Als</legend>
            <div className="grid grid-cols-2 gap-2" role="group">
              {(["admin", "member"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  className={`min-h-12 border px-4 py-3 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] ${role === r ? "border-accent-alt text-accent-alt" : "border-line text-muted hover:text-primary"}`}
                >
                  {ROLE[r]}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={pending || !email.trim()} className={`${primary} self-start`}>
            {pending ? "Bezig…" : role === "admin" ? "Maak beheerder" : "Geef toegang als lid"}
          </button>
        </form>
      )}

      {/* ── Vast in Vercel ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-11 text-faint uppercase">Vast in Vercel</h2>
        <p className="text-muted">
          Deze adressen staan in de instellingen van het Vercel-project (PORTAL_ADMINS en PORTAL_MEMBERS) en zijn hier
          niet aan te passen. Zo is er altijd een beheerder die erin kan, wat er hierboven ook gebeurt.
        </p>
        <ul className="flex flex-col">
          {fixed.map((f) => (
            <li key={f.email} className="flex items-center justify-between gap-4 border-b border-line py-3">
              <span className="truncate">
                {f.email}
                {f.email === me && <span className="text-muted"> (jij)</span>}
              </span>
              <span className={`shrink-0 font-mono text-12 uppercase ${f.role === "admin" ? "text-accent-alt" : "text-muted"}`}>
                {ROLE[f.role]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
