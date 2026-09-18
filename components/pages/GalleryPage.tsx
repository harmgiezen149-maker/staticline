import { Page } from "@/components/Page";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getCopy } from "@/content";
import { photos } from "@/content/media";
import type { Locale } from "@/lib/i18n";

/**
 * De fotopagina.
 *
 * GEËXTRAPOLEERD, maar het raster zelf is ontworpen en wordt hergebruikt uit de
 * homepage. Zolang er geen fotografie is, staan hier de benoemde placeholders uit
 * de design-handoff.
 */
export function GalleryPage({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);

  return (
    <Page locale={locale} path="/fotos" title={copy.gallery.title}>
      <PhotoGrid locale={locale} photos={photos} heading={false} />
    </Page>
  );
}
