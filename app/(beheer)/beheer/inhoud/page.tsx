import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentForm } from "@/components/beheer/ContentForm";
import { VideoManager } from "@/components/beheer/VideoManager";
import { Shell } from "@/components/beheer/Shell";
import { getCopy } from "@/content";
import { loadContent, loadMedia } from "@/lib/portal/content";
import { TEXT_KEYS, storageKey } from "@/lib/portal/content-keys";
import { getSession } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Inhoud" };

/**
 * De publieke inhoud aanpassen zonder mij.
 *
 * Wat hier niet staat: de foto's. Die moeten geüpload worden, en daar is een
 * Vercel Blob-opslag voor nodig — een aparte voorziening die eerst in Vercel
 * aangezet moet worden. Zolang die er niet is, zou een uploadknop alleen maar
 * een foutmelding opleveren.
 *
 * Ook niet: de bandbio en de leden. Die komen uit de Band App en horen daar
 * bijgehouden te worden, niet op twee plekken.
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

  const [content, media] = await Promise.all([loadContent(), loadMedia()]);

  // De tekst uit de code als plaatshouder meegeven, zodat je in het formulier
  // ziet wat er nu op de site staat in plaats van een leeg veld.
  const values: Record<string, string> = { ...content };
  for (const field of TEXT_KEYS) {
    for (const locale of ["nl", "en"] as const) {
      const copy = getCopy(locale) as unknown as Record<string, Record<string, string>>;
      const [group, name] = field.key.split(".");
      values[`fallback:${storageKey(field.key, locale)}`] =
        copy[group]?.[name] ?? "";
    }
  }

  const videos = media
    .filter((row) => row.kind === "video")
    .map((row) => ({ id: row.id, youtubeId: row.url, title: row.alt }));

  return (
    <Shell session={session} title="Inhoud">
      <div className="flex flex-col gap-10">
        <ContentForm values={values} />
        <VideoManager videos={videos} />
      </div>
    </Shell>
  );
}
