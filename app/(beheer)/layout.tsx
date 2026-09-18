import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";
import "../globals.css";

/**
 * Het besloten deel.
 *
 * Een derde root layout naast app/(nl) en app/(en), om dezelfde reden als die
 * twee: /beheer staat dan gewoon in de routeringstabel en hangt niet van een
 * omleiding af. Zie app/(nl)/layout.tsx voor die afweging.
 *
 * Alleen Nederlands, met opzet. Het publieke deel is tweetalig omdat bezoekers
 * dat nodig hebben; vier Nederlandse bandleden niet. Tweetalig maken zou elk
 * label verdubbelen zonder dat iemand de tweede helft ooit ziet. De teksten
 * staan daarom rechtstreeks in de componenten en niet in content/ — die map
 * bestaat juist om twee talen gelijk te houden.
 */
export const metadata: Metadata = {
  title: { default: "Beheer", template: "%s — Beheer" },
  // Niet in Google. Dit is geen geheim — de inlog beschermt de inhoud — maar een
  // beheerscherm hoort niet in de zoekresultaten van een bandnaam te staan.
  robots: { index: false, follow: false },
};

export default function BeheerLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={fontVariables}>
      <body className="bg-base text-primary">{children}</body>
    </html>
  );
}
