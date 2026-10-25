import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Shell } from "@/components/beheer/Shell";
import type { Design } from "@/lib/design";
import { getDesign } from "@/lib/design-store";
import { getSession } from "@/lib/portal/session";

import { setDesign } from "./actions";

export const metadata: Metadata = { title: "Ontwerp" };

const OPTIONS: { value: Design; title: string; text: string }[] = [
  {
    value: "klassiek",
    title: "Klassiek",
    text: "Het ontwerp zoals het gemaakt is: strak, koppen op één regel met een lijn eronder, de rode balk met de volgende show en de agenda als lijst.",
  },
  {
    value: "microduck",
    title: "Microduck",
    text: "Naar de Microduck-pagina van Pollen Robotics: koppen in twee tonen met een label erboven, knoppen met een teal plaat, een schuine looptekst met de volgende show, showkaarten met een sticker en een stippenraster.",
  },
];

/**
 * Wisselen tussen de twee ontwerpen van de publieke site. Zie lib/design.ts.
 * Het geldt meteen voor iedereen, en terugzetten kan altijd: de inhoud is in
 * beide ontwerpen dezelfde.
 */
export default async function OntwerpPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  if (session.role !== "admin") {
    return (
      <Shell session={session} title="Ontwerp">
        <p className="text-muted">Alleen een beheerder kan het ontwerp wisselen.</p>
      </Shell>
    );
  }

  const current = await getDesign();

  return (
    <Shell session={session} title="Ontwerp">
      <div className="flex max-w-[880px] flex-col gap-6">
        <p className="text-muted">
          Kies hoe de publieke site eruitziet. Het geldt meteen voor iedere bezoeker, in het Nederlands en het
          Engels. De teksten, de agenda en de foto&apos;s blijven hetzelfde; terugzetten kan altijd.
        </p>

        <form action={setDesign} className="grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const active = option.value === current;
            return (
              <button
                key={option.value}
                type="submit"
                name="ontwerp"
                value={option.value}
                aria-pressed={active}
                className={`flex flex-col gap-3 border p-6 text-left transition-colors duration-[120ms] ${active ? "border-accent-alt bg-surface" : "border-line hover:border-primary"}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-22 font-bold tracking-wide12 uppercase">{option.title}</span>
                  <span
                    className={`font-mono text-12 tracking-wide14 uppercase ${active ? "text-accent-alt" : "text-muted"}`}
                  >
                    {active ? "Staat aan" : "Kies dit"}
                  </span>
                </span>
                <span className="text-muted">{option.text}</span>
              </button>
            );
          })}
        </form>

        <p className="text-muted">
          <a href="/" target="_blank" rel="noopener" className="underline">
            Open de site ↗
          </a>{" "}
          om het te bekijken. Een pagina die al openstaat toont het andere ontwerp na herladen.
        </p>
      </div>
    </Shell>
  );
}
