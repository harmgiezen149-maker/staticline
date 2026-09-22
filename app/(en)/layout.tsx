import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import { getCopy } from "@/content";
import { fontVariables } from "@/lib/fonts";
import { siteUrl } from "@/lib/site";
import "../globals.css";

/** De Engelse kant van de site. Zie app/(nl)/layout.tsx voor de opzet. */
const copy = getCopy("en");

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

export default function EnLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="bg-base text-primary">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
