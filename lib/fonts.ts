import { Oswald, Inter, JetBrains_Mono } from "next/font/google";

/**
 * De drie letterfamilies, zelf gehost.
 *
 * `next/font/google` haalt de bestanden tijdens de build op en serveert ze
 * daarna vanaf het eigen domein, dus de bezoeker doet geen enkel verzoek aan
 * Google. Dat is wat docs/02-architecture.md bedoelt met zelf hosten, en het
 * scheelt een DNS-lookup en een verbinding op een trage lijn.
 *
 * Alleen de gewichten die het ontwerp gebruikt. Elk extra gewicht is een bestand
 * dat iemand op 4G binnenhaalt zonder het te zien.
 *
 * Staan hier los, en niet in een layout, omdat er twee root layouts zijn — één
 * per taal. Zo worden de fonts één keer geladen en niet twee keer.
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

export const fontVariables = `${oswald.variable} ${inter.variable} ${jetbrainsMono.variable}`;
