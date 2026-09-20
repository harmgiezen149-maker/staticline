import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * db/schema.sql meenemen in de functie achter /beheer/database.
   *
   * Dat scherm leest het bestand om de tabellen bij te werken. Next traceert
   * alleen bestanden die het in de code ziet staan, en een `readFileSync` met
   * een samengesteld pad ziet het niet — zonder deze regel zit het bestand niet
   * in de deploy en meldt het scherm dat het schema ontbreekt.
   */
  outputFileTracingIncludes: {
    "/beheer/database": ["./db/**/*.sql"],
    // De tone of voice wordt als markdownbestand van schijf gelezen; zie
    // lib/tov/config.ts. Next traceert alleen wat het in de code ziet staan.
    "/beheer/tov": ["./content/tone-of-voice.md"],
    "/api/tov": ["./content/tone-of-voice.md"],
  },

  /**
   * De service worker van het beheer mag over heel /beheer gaan.
   *
   * Een service worker mag standaard niet verder reiken dan de map waar hij zelf
   * in staat. `/beheer/sw.js` zou dus alleen `/beheer/…` beheersen en niet
   * `/beheer` zelf — precies het adres waar de app op opstart. Deze kop verruimt
   * dat tot `/beheer`; components/beheer/PwaSetup.tsx vraagt om die scope.
   *
   * Verder niets: buiten /beheer heeft de publieke site geen service worker, en
   * die hoort er ook geen te krijgen. Zie public/beheer/sw.js.
   */
  async headers() {
    return [
      {
        source: "/beheer/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/beheer" },
          // Een service worker die uit de cache komt, is een service worker die
          // een uitrol mist. Browsers controleren hem sowieso elke dag; dit
          // maakt er elke keer van.
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },

  images: {
    /**
     * De ledenfoto's staan in de Blob-opslag van de Band App. Alleen die host,
     * en alleen over https: `next/image` haalt deze adressen op vanaf de server,
     * dus een open lijst zou van deze site een gratis afbeeldingsproxy maken.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
