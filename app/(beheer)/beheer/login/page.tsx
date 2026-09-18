import type { Metadata } from "next";

import { LoginForm } from "@/components/beheer/LoginForm";
import { portalConfigured } from "@/lib/portal/access";

export const metadata: Metadata = { title: "Inloggen" };

/**
 * Waarom iemand hier terechtkomt met een foutcode.
 *
 * "Al gebruikt" en "verlopen" staan er apart in. Het zou makkelijker zijn om
 * beide "deze link werkt niet" te noemen, maar dan zit je te raden waaróm hij
 * niet werkt — en juist bij een eenmalige link is dat verschil de verklaring.
 */
const REASONS: Record<string, string> = {
  "no-token": "Er zat geen sleutel in die link. Vraag een nieuwe aan.",
  unknown: "Deze link hoort nergens bij. Vraag een nieuwe aan.",
  expired: "Deze link is verlopen. Hij is een kwartier geldig.",
  used: "Deze link is al gebruikt. Elke link werkt één keer.",
  error: "Er ging iets mis aan onze kant. Probeer het zo nog eens.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/beheer/login">) {
  // In Next 16 is searchParams een promise.
  const params = await searchParams;
  const reason = typeof params.fout === "string" ? REASONS[params.fout] : null;
  const loggedOut = params.uit === "1";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-11 text-faint uppercase">Static Line</p>
        <h1 className="font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase">
          Beheer
        </h1>
      </div>

      {!portalConfigured() ? (
        <p className="border border-line-strong p-6 text-muted">
          Het besloten deel is nog niet ingesteld. Zie{" "}
          <span className="font-mono text-12">docs/07-instellen.md</span>.
        </p>
      ) : (
        <>
          {reason && <p className="text-danger">{reason}</p>}
          {loggedOut && !reason && (
            <p className="text-muted">Je bent uitgelogd.</p>
          )}
          <LoginForm />
        </>
      )}
    </main>
  );
}
