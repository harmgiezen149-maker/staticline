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
