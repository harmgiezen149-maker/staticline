import Link from "next/link";

import type { Session } from "@/lib/portal/session";

/**
 * Het omhulsel van elk beheerscherm.
 *
 * Soberder dan de publieke site: geen korrel, geen accentvlakken, geen hero.
 * docs/05-build-plan.md schrijft dat voor, en met reden — dit wordt backstage op
 * een telefoon gebruikt, vlak voor het podium op. Dezelfde tokens, veel minder
 * textuur.
 */
type Props = {
  session: Session;
  title: string;
  children: React.ReactNode;
};

const LINKS = [
  { href: "/beheer", label: "Overzicht" },
  { href: "/beheer/boekingen", label: "Boekingen" },
  { href: "/beheer/nieuwsbrief", label: "Nieuwsbrief" },
  { href: "/beheer/inhoud", label: "Inhoud" },
  { href: "/beheer/database", label: "Database" },
] as const;

export function Shell({ session, title, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line-default">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <nav className="flex items-center gap-6">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="font-mono text-11 text-faint uppercase">
              {session.email}
              {session.role === "admin" && " · beheerder"}
            </span>
            {/* Een formulier en geen link: uitloggen via GET zou je uitloggen
                zodra iets op een pagina naar dat adres verwijst. */}
            <form action="/api/beheer/logout" method="post">
              <button
                type="submit"
                className="font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8">
        <h1 className="mb-6 font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
