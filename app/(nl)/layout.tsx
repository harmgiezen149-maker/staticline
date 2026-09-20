import type { Metadata } from "next";

import { getCopy } from "@/content";
import { fontVariables } from "@/lib/fonts";
import { siteUrl } from "@/lib/site";
import "../globals.css";

/**
 * De Nederlandse kant van de site.
 *
 * Er zijn twee root layouts, één per taal, elk met hun eigen `<html lang>`.
 * Nederlands staat op de wortel (`/`, `/agenda`, `/boeken`), Engels onder `/en`.
 *
 * Waarom zo en niet met één `app/[lang]` plus een rewrite in de proxy: dan is `/`
 * geen echte route maar het resultaat van middleware, en op Vercel gaf dat een
 * 404 op precies dat adres — terwijl het lokaal werkte. Het adres dat op de
 * sticker met de QR-code komt te staan, hoort niet van een routeringslaag af te
 * hangen die zich op twee plekken anders gedraagt. Nu staan `/` en `/en` allebei
 * gewoon in de routeringstabel.
 *
 * De prijs is één dun bestand per pagina per taal. Dat is te overzien, en het
 * type in content/types.ts bewaakt dat er geen tekst in één taal blijft hangen.
 */
const copy = getCopy("nl");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: copy.meta.title, template: `%s — ${copy.meta.title}` },
  description: copy.meta.description,
  /**
   * De iconen van de site. Stonden er niet, dus een tabblad toonde het
   * standaard-wereldbolletje — op een adres dat op een QR-sticker komt.
   * Gemaakt met scripts/gen-social-images.mjs.
   */
  icons: {
    icon: [
      { url: "/assets/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/assets/apple-touch-icon.png",
  },
};

export default function NlLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={fontVariables}>
      <body className="bg-base text-primary">{children}</body>
    </html>
  );
}
