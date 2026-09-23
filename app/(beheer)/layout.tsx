import type { Metadata, Viewport } from "next";

import { PwaSetup } from "@/components/beheer/PwaSetup";
import { CalmLayer } from "@/components/motion/CalmLayer";
import { MotionHead } from "@/components/motion/MotionHead";
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
  /**
   * Hiermee is het beheer een app die je op je beginscherm kunt zetten.
   *
   * Alleen hier, en met opzet: de publieke site heeft geen manifest, want een
   * bezoeker die de agenda leest hoeft niets te installeren. Zie
   * app/(beheer)/beheer/manifest.webmanifest/route.ts.
   */
  manifest: "/beheer/manifest.webmanifest",
  // iOS leest het manifest niet voor het icoon en de titel op het beginscherm;
  // die komen van deze twee.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SL Beheer" },
  icons: { icon: "/beheer/icon-192.png", apple: "/beheer/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  // De kleur van de balk om de geïnstalleerde app heen. Gelijk aan --bg-base en
  // aan background_color in het manifest, zodat er niets zichtbaar verspringt.
  themeColor: "#0d0f12",
  // De onderste veilige zone (de gebarenbalk) benutten in plaats van eromheen
  // werken, nu dit zonder adresbalk kan draaien.
  viewportFit: "cover",
};

/**
 * Chrome vuurt `beforeinstallprompt` zodra het de app installeerbaar vindt, en
 * dat kan al gebeurd zijn voordat React geladen is. Een luisteraar in een
 * component komt dan te laat en mist het event voorgoed, waardoor de knop nooit
 * verschijnt. Daarom hier, in een script dat vóór de app draait; de knop leest
 * het uit op `window`. Dezelfde oplossing als in de Band App.
 */
const VANG_INSTALLPROMPT = `
window.installPrompt = null;
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.installPrompt = e;
  window.dispatchEvent(new Event("installpromptchange"));
});
window.addEventListener("appinstalled", function () {
  window.installPrompt = null;
  window.dispatchEvent(new Event("installpromptchange"));
});`;

export default function BeheerLayout({ children }: LayoutProps<"/">) {
  return (
    // Zie app/(nl)/layout.tsx over `no-js` en suppressHydrationWarning.
    <html lang="nl" className={`no-js ${fontVariables}`} suppressHydrationWarning>
      <head>
        <MotionHead variant="calm" />
      </head>
      <body className="bg-base text-primary">
        <script dangerouslySetInnerHTML={{ __html: VANG_INSTALLPROMPT }} />
        <PwaSetup />
        {children}
        {/* De lichte basis van v2: een rustige overgang tussen schermen en een
            voortgangslijn voor wat even duurt. Zie components/motion/CalmLayer.tsx. */}
        <div className="pt" aria-hidden="true">
          <div className="pt__band" />
          <div className="pt__band" />
          <div className="pt__band" />
          <div className="pt__band" />
          <div className="pt__band" />
        </div>
        <div className="progress-line" aria-hidden="true" />
        <CalmLayer />
      </body>
    </html>
  );
}
