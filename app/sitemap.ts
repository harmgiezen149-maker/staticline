import type { MetadataRoute } from "next";

import { localePath } from "@/lib/i18n";
import { PUBLIC_PATHS } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";

/**
 * sitemap.xml.
 *
 * Elke pagina staat er één keer in, met de andere taal ernaast als `alternate`.
 * Dat is dezelfde informatie als de `hreflang` in de pagina zelf, en die twee
 * horen elkaar te bevestigen: een zoekmachine die er maar één van ziet, twijfelt.
 *
 * De lijst komt uit PUBLIC_PATHS in lib/metadata.ts en niet uit een tweede
 * opsomming hier. Een pagina erbij hoort op één plek bijgewerkt te worden.
 *
 * Wat er niet in staat: `/beheer` (afgeschermd en op noindex),
 * `/nieuwsbrief/bevestigen` (een adres met een sleutel erin, dat voor één
 * persoon één keer bestaat) en alles onder `/api`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  // De homepage zonder afsluitende schuine streep. Dat lijkt muggenzifterij,
  // maar Next schrijft de canonical in de pagina zelf ook zo (`https://…` en
  // niet `https://…/`), en de sitemap en de pagina horen letterlijk hetzelfde
  // adres te noemen — anders moet een zoekmachine gokken welke hij gelooft.
  // Nagemeten in de gebouwde uitvoer; niet op gevoel veranderen.
  const absoluut = (path: string) => `${base}${path === "/" ? "" : path}`;

  return PUBLIC_PATHS.flatMap((path) =>
    (["nl", "en"] as const).map((locale) => ({
      url: absoluut(localePath(locale, path)),
      // De homepage is het adres op de sticker met de QR-code; die weegt zwaarder
      // dan de rest. Verder geen fijnmazige nummering: zoekmachines doen er
      // weinig mee en het is een getal dat iemand moet bijhouden.
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: {
          nl: absoluut(localePath("nl", path)),
          en: absoluut(localePath("en", path)),
        },
      },
    })),
  );
}
