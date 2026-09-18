import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
