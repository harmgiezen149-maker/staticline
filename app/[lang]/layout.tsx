import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";

import { getCopy } from "@/content";
import { isLocale, locales } from "@/lib/i18n";
import "../globals.css";

/**
 * Letters, zelf gehost.
 *
 * `next/font/google` haalt de bestanden tijdens de build op en serveert ze
 * daarna vanaf het eigen domein, dus de bezoeker doet geen enkel verzoek aan
 * Google. Dat is wat docs/02-architecture.md bedoelt met zelf hosten, en het
 * scheelt een DNS-lookup en een verbinding op een trage lijn.
 *
 * Alleen de gewichten die het ontwerp gebruikt. Elk extra gewicht is een bestand
 * dat iemand op 4G binnenhaalt zonder het te zien.
 */
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-oswald",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

/** Beide talen vooraf bouwen; er zijn er maar twee. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const copy = getCopy(lang);
  return {
    title: {
      default: copy.meta.title,
      template: `%s — ${copy.meta.title}`,
    },
    description: copy.meta.description,
    alternates: {
      canonical: lang === "nl" ? "/" : "/en",
      languages: { nl: "/", en: "/en" },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      className={`${oswald.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-base text-primary">{children}</body>
    </html>
  );
}
