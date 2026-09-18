import { Page } from "@/components/Page";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getCopy } from "@/content";
import { getPhotos } from "@/lib/site-content";
import type { Locale } from "@/lib/i18n";

/**
 * De fotopagina.
 *
 * GEËXTRAPOLEERD, maar het raster zelf is ontworpen en wordt hergebruikt uit de
 * homepage. Zolang er geen fotografie is, staan hier de benoemde placeholders uit
 * de design-handoff.
 */
export async function GalleryPage({ locale }: { locale: Locale }) {
  const photos = await getPhotos();
  const copy = getCopy(locale);

  return (
    <Page locale={locale} path="/fotos" title={copy.gallery.title}>
      <PhotoGrid locale={locale} photos={photos} heading={false} />
    </Page>
  );
}
