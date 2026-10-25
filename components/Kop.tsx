import type { ReactNode } from "react";

import { splitHeading } from "@/lib/design";
import { getDesign } from "@/lib/design-store";

/**
 * De tekst van een sectiekop, in het gekozen ontwerp.
 *
 * Klassiek: de tekst zoals hij is, precies de markup van hiervoor. Microduck:
 * het laatste woord in een eigen span, dat styles/microduck.css op een eigen
 * regel en in rood zet ("ALLE / SHOWS"). Zie lib/design.ts.
 */
export async function KopTekst({ text }: { text: string }) {
  if ((await getDesign()) !== "microduck") return text;
  const [first, last] = splitHeading(text);
  return (
    <>
      {first && <span className="kop-eerst">{first} </span>}
      <span className="kop-accent">{last}</span>
    </>
  );
}

/**
 * Het label boven een sectiekop, alleen in het Microduck-ontwerp: een nummer en
 * een korte zin in teal monoletters ("01 — Hier spelen we"). In het klassieke
 * ontwerp staat er niets, en blijft de kop zoals hij was.
 *
 * Met de kop samen in één blok (`.kop-blok`), zodat het stippenraster achter
 * label en kop valt en niet achter de inhoud eronder.
 */
export async function KopBlok({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: ReactNode;
}) {
  if ((await getDesign()) !== "microduck") return children;
  return (
    <div className="kop-blok">
      <p className="kop-label" data-decode>
        {String(index).padStart(2, "0")} — {label}
      </p>
      {children}
    </div>
  );
}
