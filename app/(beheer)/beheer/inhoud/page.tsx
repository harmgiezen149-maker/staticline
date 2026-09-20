import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentForm } from "@/components/beheer/ContentForm";
import { ImageManager, type SlotState } from "@/components/beheer/ImageManager";
import { PhotoManager } from "@/components/beheer/PhotoManager";
import { SiteTextTranslator } from "@/components/beheer/SiteTextTranslator";
import { VideoManager } from "@/components/beheer/VideoManager";
import { Shell } from "@/components/beheer/Shell";
import { loadContent, loadMedia } from "@/lib/portal/content";
import { IMAGE_SLOTS, storageKey } from "@/lib/portal/content-keys";
import { copyGroups } from "@/lib/portal/copy-keys";
import { getSession } from "@/lib/portal/session";
import { codeText } from "@/lib/portal/copy-text";
import { siteTextStale } from "@/lib/portal/site-texts";
import { getHeroBackground, getWordmark } from "@/lib/site-content";

export const metadata: Metadata = { title: "Inhoud" };

/**
 * De publieke inhoud aanpassen zonder mij.
 *
 * Wat hier niet staat: de bandbio en de leden. Die komen uit de Band App en
 * horen daar bijgehouden te worden, niet op twee plekken.
 */
export default async function InhoudPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  if (session.role !== "admin") {
    return (
      <Shell session={session} title="Inhoud">
        <p className="text-muted">
          Alleen een beheerder kan de inhoud van de site aanpassen.
        </p>
      </Shell>
    );
  }

  const [content, media, wordmark, hero] = await Promise.all([
    loadContent(),
    loadMedia(),
    getWordmark(),
    getHeroBackground(),
  ]);

  // Of het huidige beeld een geüpload bestand is of het bestand uit de code.
  // Dat verschil bepaalt of "terugzetten" iets te doen heeft.
  const slots: SlotState[] = [
    { key: IMAGE_SLOTS[0].key, ...wordmark, custom: Boolean(content[storageKey(IMAGE_SLOTS[0].key)]) },
    { key: IMAGE_SLOTS[1].key, ...hero, custom: Boolean(content[storageKey(IMAGE_SLOTS[1].key)]) },
  ];

  /**
   * De teksten, per groep.
   *
   * De lijst komt uit content/nl.ts en wordt niet met de hand bijgehouden. Wat
   * daar staat, is hier aan te passen; zie lib/portal/copy-keys.ts.
   */
  const groups = copyGroups();

  // De tekst uit de code als plaatshouder meegeven, zodat je in het formulier
  // ziet wat er nu op de site staat in plaats van een leeg veld.
  const values: Record<string, string> = { ...content };
  const stale: Record<string, boolean> = {};
  let toTranslate = 0;

  for (const group of groups) {
    for (const field of group.fields) {
      for (const locale of ["nl", "en"] as const) {
        values[`fallback:${storageKey(field.key, locale)}`] = codeText(field.key, locale);
      }

      // Welke Engelse teksten niet meer bij het Nederlands horen, en hoeveel er
      // te vertalen zijn. Alleen teksten die hier zijn aangepast tellen mee:
      // staat het Nederlands nog zoals in de code, dan staat het Engels in
      // content/en.ts en klopt dat al.
      const isStale = siteTextStale(field.key, content, field.code);
      stale[field.key] = isStale;

      const dutch = (content[storageKey(field.key, "nl")] ?? "").trim();
      const english = (content[storageKey(field.key, "en")] ?? "").trim();
      if (dutch && (!english || isStale)) toTranslate += 1;
    }
  }

  const videos = media
    .filter((row) => row.kind === "video")
    .map((row) => ({ id: row.id, youtubeId: row.url, title: row.alt }));

  const photos = media
    .filter((row) => row.kind === "photo")
    .map((row) => ({
      id: row.id,
      url: row.url,
      alt: row.alt,
      caption: row.caption,
    }));

  return (
    <Shell session={session} title="Inhoud">
      <div className="flex flex-col gap-10">
        <ContentForm groups={groups} values={values} stale={stale} />
        <SiteTextTranslator todo={toTranslate} />
        <ImageManager slots={slots} />
        <PhotoManager photos={photos} />
        <VideoManager videos={videos} />
      </div>
    </Shell>
  );
}
