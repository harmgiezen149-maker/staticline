import type { Metadata, Viewport } from "next";

import { MotionHead } from "@/components/motion/MotionHead";
import { fontVariables } from "@/lib/fonts";
import { siteUrl } from "@/lib/site";
import "../globals.css";
import "../../styles/screen.css";

/**
 * Het scherm: de startanimatie als doorlopende lus, voor een beamer of een tv.
 *
 * Een vierde root layout naast (nl), (en) en (beheer), om dezelfde reden: dit is
 * geen gewone pagina van de site. Geen kop, geen menu, geen voet, geen
 * motion-laag met loader en paginaovergangen — alleen het beeld, schermvullend.
 * Zie components/screen/ScreenLoop.tsx.
 *
 * Openbaar maar nergens gelinkt, en niet in Google of de sitemap: wie het adres
 * kent, kan het op een laptop bij de zaal openen zonder in te loggen. Er staat
 * niets op wat niet ook op het podium te zien is.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Static Line — scherm",
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/assets/icon-32.png", sizes: "32x32", type: "image/png" }] },
};

export const viewport: Viewport = {
  themeColor: "#0d0f12",
  viewportFit: "cover",
};

export default function SchermLayout({ children }: LayoutProps<"/">) {
  return (
    // Zie app/(nl)/layout.tsx over `no-js` en suppressHydrationWarning. De
    // lichte variant van het kopscript: alleen js/no-js en minder beweging, geen
    // loader.
    <html lang="nl" className={`no-js ${fontVariables}`} suppressHydrationWarning>
      <head>
        <MotionHead variant="calm" />
      </head>
      <body className="bg-inset text-primary">{children}</body>
    </html>
  );
}
