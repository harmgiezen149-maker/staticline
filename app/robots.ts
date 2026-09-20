import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * robots.txt.
 *
 * Buiten de drie route groups, zodat dit adres van geen enkele taal afhangt —
 * net als de sitemap ernaast. Er is er maar één per domein.
 *
 * `/beheer` staat er bewust in. Dat is geen beveiliging: de inlog beschermt de
 * inhoud, en wie het adres raadt komt er alsnog niet in. Het is netheid — een
 * beheerscherm hoort niet in de zoekresultaten van een bandnaam. De layout van
 * dat deel zet daar ook zelf `noindex` op; dit scheelt een crawler de moeite om
 * dat te ontdekken.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/beheer", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
